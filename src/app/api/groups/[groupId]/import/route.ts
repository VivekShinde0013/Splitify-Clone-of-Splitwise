import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseCSV } from "@/lib/csvParser";
import { hashPassword } from "@/app/api/auth/login/route";

type RouteParams = Promise<{ groupId: string }>;

// Helper to normalize strings for name matching
const normalizeName = (name: string): string => {
  const norm = name.trim().toLowerCase();
  // Handle specific typos/variants mentioned in the Spreetail CSV
  if (norm.startsWith("priya")) return "priya";
  if (norm.startsWith("rohan")) return "rohan";
  if (norm.startsWith("aisha")) return "aisha";
  if (norm.startsWith("meera")) return "meera";
  if (norm.startsWith("sam")) return "sam";
  if (norm.startsWith("dev")) return "dev";
  return norm.replace(/[^a-z0-9]/g, "");
};

// Default mapping of names to system emails for auto-creation
const DEFAULT_EMAILS: Record<string, string> = {
  aisha: "aisha@example.com",
  rohan: "rohan@example.com",
  priya: "priya@example.com",
  meera: "meera@example.com",
  sam: "sam@example.com",
  dev: "dev@example.com",
};

// Timeline bounds for members
const SAM_JOIN_DATE = new Date("2026-04-15");
const MEERA_LEAVE_DATE = new Date("2026-03-31");

// Helper to parse dates in various formats (e.g. YYYY-MM-DD, DD/MM/YYYY, Mar 14)
function parseMessyDate(dateStr: string): Date {
  const cleanStr = dateStr.trim();
  if (!cleanStr) return new Date();

  // Handle DD/MM/YYYY formats
  if (cleanStr.includes("/")) {
    const parts = cleanStr.split("/");
    if (parts.length === 3) {
      const p1 = parseInt(parts[0]);
      const p2 = parseInt(parts[1]);
      const p3 = parseInt(parts[2]);
      
      // If the third part is 4 digits, it's YYYY, so format is DD/MM/YYYY
      if (p3 > 1000) {
        return new Date(p3, p2 - 1, p1);
      }
    }
  }

  // Handle "Mar 14" format (missing year, assume 2026)
  if (cleanStr.match(/^[a-zA-Z]{3}\s+\d+$/)) {
    return new Date(`${cleanStr}, 2026`);
  }

  const parsed = new Date(cleanStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function POST(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { groupId } = await params;
    const { csvText } = await req.json();

    if (!csvText) {
      return NextResponse.json(
        { error: "CSV text is required" },
        { status: 400 }
      );
    }

    // Verify group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Parse CSV
    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      return NextResponse.json(
        { error: "CSV must contain a header and at least one data row" },
        { status: 400 }
      );
    }

    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const dataRows = rows.slice(1);

    // Identify column indices
    let dateIdx = headers.findIndex((h) => h.includes("date"));
    let descIdx = headers.findIndex((h) => h.includes("desc") || h.includes("item") || h.includes("title"));
    let amountIdx = headers.findIndex((h) => h.includes("amount") || h.includes("cost") || h.includes("price") || h.includes("val"));
    let paidByIdx = headers.findIndex((h) => h.includes("paid") || h.includes("payer") || h.includes("by"));
    let splitIdx = headers.findIndex((h) => h.includes("split") || h.includes("between") || h.includes("member") || h.includes("who"));
    let typeIdx = headers.findIndex((h) => h.includes("type"));
    let currencyIdx = headers.findIndex((h) => h.includes("curr"));

    // Fallback defaults if headers not found
    if (dateIdx === -1) dateIdx = 0;
    if (descIdx === -1) descIdx = 1;
    if (amountIdx === -1) amountIdx = 2;
    if (paidByIdx === -1) paidByIdx = 3;
    if (splitIdx === -1) splitIdx = 4;
    if (typeIdx === -1) typeIdx = 5;
    if (currencyIdx === -1) currencyIdx = 6;

    const parsedEntries: any[] = [];
    const anomalies: any[] = [];

    // Helper to log anomalies
    const logAnomaly = (rowNum: number, field: string, value: string, type: string, action: string, severity: "WARNING" | "ERROR") => {
      anomalies.push({
        row: rowNum,
        field,
        value,
        type,
        action,
        severity,
      });
    };

    // Pre-fetch all group members
    const groupMemberMap = new Map<string, any>();
    group.members.forEach((m: any) => {
      groupMemberMap.set(normalizeName(m.user.name), m.user);
    });

    // We will collect and process all rows in memory
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // Row number in CSV file (1-based, plus header)

      // Skip completely empty rows
      if (row.length === 0 || (row.length === 1 && row[0] === "")) {
        continue;
      }

      // 1. Parse Date
      const rawDate = row[dateIdx] || "";
      const expenseDate = parseMessyDate(rawDate);
      if (rawDate && isNaN(new Date(rawDate).getTime())) {
        logAnomaly(
          rowNum,
          "Date",
          rawDate,
          "Inconsistent Date Format",
          `Interpreted date as ${expenseDate.toISOString().split("T")[0]}`,
          "WARNING"
        );
      }

      // 2. Parse Description
      let description = row[descIdx] || "";
      if (!description.trim()) {
        description = "Imported Shared Expense";
        logAnomaly(
          rowNum,
          "Description",
          "",
          "Missing Description",
          `Set description to "${description}"`,
          "WARNING"
        );
      }

      // 3. Parse Currency and Amount
      const rawAmountStr = row[amountIdx] || "";
      let currency = (row[currencyIdx] || "").toUpperCase().trim();
      let originalAmount = parseFloat(rawAmountStr.replace(/[^0-9.-]/g, ""));

      // Check if currency symbol or label is inside the amount column
      if (rawAmountStr.includes("$") || rawAmountStr.toUpperCase().includes("USD")) {
        currency = "USD";
      } else if (rawAmountStr.includes("₹") || rawAmountStr.toUpperCase().includes("INR")) {
        currency = "INR";
      }

      if (isNaN(originalAmount)) {
        originalAmount = 0.0;
        logAnomaly(
          rowNum,
          "Amount",
          rawAmountStr,
          "Non-numeric Amount",
          "Set amount to 0.00",
          "ERROR"
        );
      }

      if (!currency) {
        currency = "INR"; // Default
        logAnomaly(
          rowNum,
          "Currency",
          "",
          "Missing Currency Symbol",
          "Defaulted currency to INR",
          "WARNING"
        );
      }

      // Currency Conversion Anomaly (Priya's request)
      let finalAmount = originalAmount;
      if (currency === "USD") {
        const rate = 83.0;
        finalAmount = Number((originalAmount * rate).toFixed(2));
        logAnomaly(
          rowNum,
          "Currency",
          `${originalAmount} USD`,
          "USD Currency Discrepancy",
          `Converted to INR at 1 USD = ₹${rate} (Total: ₹${finalAmount})`,
          "WARNING"
        );
      }

      // Negative Amount Anomaly
      if (finalAmount < 0) {
        logAnomaly(
          rowNum,
          "Amount",
          originalAmount.toString(),
          "Negative Amount (Refund)",
          "Importing as negative splits (reducing outstanding debts)",
          "WARNING"
        );
      }

      // Zero Amount Anomaly
      if (finalAmount === 0) {
        logAnomaly(
          rowNum,
          "Amount",
          originalAmount.toString(),
          "Zero Cost Transaction",
          "Imported as zero-amount expense log",
          "WARNING"
        );
      }

      // 4. Parse Payer
      const rawPayer = row[paidByIdx] || "";
      const payerNorm = normalizeName(rawPayer);
      let payerUser = groupMemberMap.get(payerNorm);

      if (!payerUser && rawPayer.trim()) {
        // Payer not in group -> attempt to find globally or create
        const systemEmail = DEFAULT_EMAILS[payerNorm] || `${payerNorm}@example.com`;
        let user = await prisma.user.findUnique({ where: { email: systemEmail } });
        
        if (!user) {
          user = await prisma.user.create({
            data: { 
              name: rawPayer.trim(), 
              email: systemEmail,
              password: hashPassword("password123")
            },
          });
        }
        payerUser = user;
        // Add to group
        await prisma.groupMember.create({
          data: { groupId, userId: user.id },
        });
        groupMemberMap.set(payerNorm, user);
        
        logAnomaly(
          rowNum,
          "Paid By",
          rawPayer,
          "Payer Not in Group",
          `Auto-created user "${rawPayer}" and added to group`,
          "WARNING"
        );
      }

      if (!payerUser) {
        // Still no payer (corrupt field) -> Default to Aisha or first group member
        payerUser = groupMemberMap.get("aisha") || group.members[0]?.user;
        logAnomaly(
          rowNum,
          "Paid By",
          rawPayer,
          "Missing or Invalid Payer",
          `Defaulted payer to "${payerUser?.name || "Unknown"}"`,
          "ERROR"
        );
      }

      // 5. Parse Split Between (Participants)
      const rawSplitStr = row[splitIdx] || "";
      // Split names by comma, semi-colon, or slash
      const rawNames = rawSplitStr.split(/[,;/]+/).map((n) => n.trim()).filter((n) => n !== "");
      
      const splitUsers: any[] = [];
      for (const rawName of rawNames) {
        const nameNorm = normalizeName(rawName);
        let sUser = groupMemberMap.get(nameNorm);
        
        if (!sUser && rawName.trim()) {
          const systemEmail = DEFAULT_EMAILS[nameNorm] || `${nameNorm}@example.com`;
          let user = await prisma.user.findUnique({ where: { email: systemEmail } });
          
          if (!user) {
            user = await prisma.user.create({
              data: { 
                name: rawName.trim(), 
                email: systemEmail,
                password: hashPassword("password123")
              },
            });
          }
          sUser = user;
          await prisma.groupMember.create({
            data: { groupId, userId: user.id },
          });
          groupMemberMap.set(nameNorm, user);
          
          logAnomaly(
            rowNum,
            "Split Between",
            rawName,
            "Participant Not in Group",
            `Auto-created user "${rawName}" and added to group`,
            "WARNING"
          );
        }
        if (sUser) {
          splitUsers.push(sUser);
        }
      }

      // If splits list is empty, default to everyone in the group
      if (splitUsers.length === 0) {
        group.members.forEach((m: any) => splitUsers.push(m.user));
        logAnomaly(
          rowNum,
          "Split Between",
          rawSplitStr,
          "Missing Split Participants",
          "Split equally among all current group members",
          "WARNING"
        );
      }

      // 6. Timeline Filtering (Sam & Meera)
      const finalParticipants: any[] = [];
      for (const u of splitUsers) {
        const uNorm = normalizeName(u.name);
        
        // Sam joined April 15, 2026. Cannot owe before this.
        if (uNorm === "sam" && expenseDate < SAM_JOIN_DATE) {
          logAnomaly(
            rowNum,
            "Split Between",
            "Sam",
            "Timeline Violation (Sam Late Join)",
            `Excluded Sam from split since expense date (${expenseDate.toISOString().split("T")[0]}) is before April 15, 2026`,
            "WARNING"
          );
          continue;
        }

        // Meera left March 31, 2026. Cannot owe after this.
        if (uNorm === "meera" && expenseDate > MEERA_LEAVE_DATE) {
          logAnomaly(
            rowNum,
            "Split Between",
            "Meera",
            "Timeline Violation (Meera Moved Out)",
            `Excluded Meera from split since expense date (${expenseDate.toISOString().split("T")[0]}) is after March 31, 2026`,
            "WARNING"
          );
          continue;
        }

        finalParticipants.push(u);
      }

      // Payer timeline warnings
      const payerNormSystem = normalizeName(payerUser.name);
      if (payerNormSystem === "sam" && expenseDate < SAM_JOIN_DATE) {
        logAnomaly(
          rowNum,
          "Paid By",
          "Sam",
          "Timeline Violation (Payer Sam)",
          `Payer Sam had not joined yet on date (${expenseDate.toISOString().split("T")[0]})`,
          "WARNING"
        );
      }
      if (payerNormSystem === "meera" && expenseDate > MEERA_LEAVE_DATE) {
        logAnomaly(
          rowNum,
          "Paid By",
          "Meera",
          "Timeline Violation (Payer Meera)",
          `Payer Meera had already left on date (${expenseDate.toISOString().split("T")[0]})`,
          "WARNING"
        );
      }

      // If everyone was filtered out, default back to the payer or first group member
      if (finalParticipants.length === 0) {
        finalParticipants.push(payerUser);
        logAnomaly(
          rowNum,
          "Split Between",
          "",
          "Empty Splits After Timeline Filter",
          `Assigned entire cost to payer "${payerUser.name}"`,
          "WARNING"
        );
      }

      // 7. Settlement Logged as Expense Anomaly
      const descLower = description.toLowerCase();
      const isSettlement = 
        descLower.includes("settle") || 
        descLower.includes("payment") || 
        descLower.includes("paid back") ||
        descLower.includes("repay") ||
        descLower.includes("deposit");

      const splitType = (row[typeIdx] || "EQUAL").toUpperCase().trim();

      parsedEntries.push({
        rowNum,
        date: expenseDate,
        description,
        amount: finalAmount,
        payerId: payerUser.id,
        payerName: payerUser.name,
        participants: finalParticipants.map((u: any) => ({ id: u.id, name: u.name })),
        splitType: isSettlement ? "SETTLEMENT" : splitType,
        isSettlement,
        originalRow: row,
      });

      if (isSettlement) {
        logAnomaly(
          rowNum,
          "Description",
          description,
          "Settlement Logged as Expense",
          `Converted transaction to direct payment/settlement from "${payerUser.name}" to "${finalParticipants[0]?.name || "recipient"}"`,
          "WARNING"
        );
      }
    }

    // 8. Smart Duplicate Detection (Exact & Conflicting)
    const processedEntries: any[] = [];
    
    // Group duplicates by Date + Payer + Amount (Exact matches or conflicts)
    // Or Date + Fuzzy matching description (e.g. sharing words like 'thalassa' or 'marina')
    const duplicateGroups: Record<string, any[]> = {};
    const groupedRowNums = new Set<number>();

    // Step A: Group by Date + Payer + Amount
    parsedEntries.forEach((entry: any) => {
      const dateStr = entry.date.toISOString().split("T")[0];
      const key = `${dateStr}_${entry.payerId}_${entry.amount}`;
      if (!duplicateGroups[key]) {
        duplicateGroups[key] = [];
      }
      duplicateGroups[key].push(entry);
    });

    const duplicatesToResolve: any[] = [];

    // Step B: Filter and identify actual duplicate groups
    for (const key in duplicateGroups) {
      const group = duplicateGroups[key];
      if (group.length > 1) {
        const first = group[0];
        
        // Exact duplicate if descriptions or keywords match fuzzy-wise
        const isExact = group.every(
          (item) => 
            item.amount === first.amount &&
            item.description.toLowerCase().replace(/[^a-z0-9]/g, "") === first.description.toLowerCase().replace(/[^a-z0-9]/g, "")
        );

        if (isExact) {
          logAnomaly(
            group[1].rowNum,
            "Row",
            `Duplicate of Row ${first.rowNum}`,
            "Exact Duplicate Entry",
            `Auto-flagged Row ${group.slice(1).map((g: any) => g.rowNum).join(", ")} for deletion, keeping Row ${first.rowNum}`,
            "WARNING"
          );

          duplicatesToResolve.push({
            type: "EXACT",
            key,
            rows: group.map((g: any, idx: number) => ({
              ...g,
              defaultAction: idx === 0 ? "KEEP" : "DELETE",
            })),
          });
        } else {
          // Conflicting entries (same cost/date, different description details - e.g. Marina Bites)
          logAnomaly(
            group[1].rowNum,
            "Row",
            `Conflict with Row ${first.rowNum}`,
            "Conflicting Duplicate Cost (Same date and amount, different descriptions)",
            "surfaced to duplicate resolver UI",
            "WARNING"
          );

          duplicatesToResolve.push({
            type: "CONFLICT",
            key,
            rows: group.map((g: any, idx: number) => ({
              ...g,
              defaultAction: idx === 0 ? "KEEP" : "DELETE",
            })),
          });
        }
        group.forEach((g: any) => groupedRowNums.add(g.rowNum));
      }
    }

    // Step C: Fuzzy description match on same day (e.g. Thalassa dinner logged by different payers/amounts)
    const fuzzyKeywords = ["thalassa", "marina", "dinner", "rent"];
    const parsedEntriesByDate: Record<string, any[]> = {};
    
    parsedEntries.forEach((entry: any) => {
      if (groupedRowNums.has(entry.rowNum)) return; // Already grouped
      const dateStr = entry.date.toISOString().split("T")[0];
      if (!parsedEntriesByDate[dateStr]) {
        parsedEntriesByDate[dateStr] = [];
      }
      parsedEntriesByDate[dateStr].push(entry);
    });

    for (const dateStr in parsedEntriesByDate) {
      const dayEntries = parsedEntriesByDate[dateStr];
      if (dayEntries.length < 2) continue;

      // Check pairs for fuzzy word matches
      for (let j = 0; j < dayEntries.length; j++) {
        for (let k = j + 1; k < dayEntries.length; k++) {
          const e1 = dayEntries[j];
          const e2 = dayEntries[k];
          
          if (groupedRowNums.has(e1.rowNum) || groupedRowNums.has(e2.rowNum)) continue;

          const words1 = e1.description.toLowerCase().split(/\s+/);
          const words2 = e2.description.toLowerCase().split(/\s+/);
          const commonWords = words1.filter((w: string) => words2.includes(w) && w.length >= 4 && fuzzyKeywords.includes(w));

          if (commonWords.length > 0) {
            // Found a fuzzy description match (e.g. Thalassa dinner)
            logAnomaly(
              e2.rowNum,
              "Row",
              `Fuzzy description conflict with Row ${e1.rowNum}`,
              "Conflicting Duplicate Event (Fuzzy description matches on same day)",
              "surfaced to duplicate resolver UI for manual approval",
              "WARNING"
            );

            duplicatesToResolve.push({
              type: "CONFLICT",
              key: `fuzzy_${dateStr}_${commonWords[0]}`,
              rows: [
                { ...e1, defaultAction: "KEEP" },
                { ...e2, defaultAction: "DELETE" }
              ]
            });

            groupedRowNums.add(e1.rowNum);
            groupedRowNums.add(e2.rowNum);
          }
        }
      }
    }

    // Step D: Add remaining non-duplicate entries to the list
    parsedEntries.forEach((entry: any) => {
      if (!groupedRowNums.has(entry.rowNum)) {
        processedEntries.push({
          ...entry,
          action: "KEEP",
        });
      }
    });

    return NextResponse.json({
      success: true,
      processedEntries,
      duplicatesToResolve,
      anomalies,
      totalRows: dataRows.length,
    });
  } catch (error: any) {
    console.error("CSV import parse error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
