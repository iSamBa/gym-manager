import { format } from "date-fns";
import type { SessionHistoryEntry } from "./types";

// CSV Export
export const exportToCSV = (
  sessions: SessionHistoryEntry[],
  filename?: string
) => {
  const headers = [
    "Date",
    "Time",
    "Trainer",
    "Location",
    "Category",
    "Status",
    "Duration (min)",
    "Participants",
    "Max Participants",
    "Attendance Rate (%)",
    "Notes",
  ];

  const csvContent = [
    headers.join(","),
    ...sessions.map((session) =>
      [
        format(new Date(session.scheduled_start), "yyyy-MM-dd"),
        `${format(new Date(session.scheduled_start), "HH:mm")}-${format(new Date(session.scheduled_end), "HH:mm")}`,
        session.trainer_name || "",
        session.location || "",
        session.session_category || "",
        session.status,
        session.duration_minutes,
        session.participant_count || 0,
        session.max_participants,
        Math.round(session.attendance_rate || 0),
        (session.notes || "").replace(/,/g, ";").replace(/\n/g, " "),
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    filename || `training-sessions-${format(new Date(), "yyyy-MM-dd")}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// PDF Export (simplified version - would use a library like jsPDF in production)
export const exportToPDF = async (sessions: SessionHistoryEntry[]) => {
  // This is a placeholder implementation
  // In production, you'd use jsPDF, PDFKit, or similar library

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Training Sessions Report</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          color: #333;
        }
        h1 { 
          color: #2563eb; 
          border-bottom: 2px solid #2563eb; 
          padding-bottom: 10px;
        }
        .summary {
          background-color: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .summary h2 {
          margin-top: 0;
          color: #1e293b;
        }
        .stats {
          display: flex;
          gap: 20px;
          margin: 10px 0;
        }
        .stat-item {
          flex: 1;
          text-align: center;
        }
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }
        .stat-label {
          font-size: 12px;
          color: #64748b;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left;
          font-size: 12px;
        }
        th { 
          background-color: #f8fafc; 
          font-weight: bold;
        }
        tr:nth-child(even) { 
          background-color: #f8fafc; 
        }
        .status-completed { color: #16a34a; font-weight: bold; }
        .status-cancelled { color: #dc2626; font-weight: bold; }
        .status-scheduled { color: #2563eb; font-weight: bold; }
        .status-in_progress { color: #ea580c; font-weight: bold; }
        .category-trial { 
          background-color: #faf5ff; 
          color: #7c3aed;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
        }
        .category-standard { 
          background-color: #eff6ff; 
          color: #2563eb;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
        }
        .category-premium { 
          background-color: #fffbeb; 
          color: #d97706;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
        }
        .category-group { 
          background-color: #f0fdfa; 
          color: #0d9488;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
        }
        .category-personal { 
          background-color: #eef2ff; 
          color: #4f46e5;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>Training Sessions Report</h1>
      <p>Generated on: ${format(new Date(), "MMMM dd, yyyy")}</p>
      
      <div class="summary">
        <h2>Summary</h2>
        <div class="stats">
          <div class="stat-item">
            <div class="stat-number">${sessions.length}</div>
            <div class="stat-label">Total Sessions</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${sessions.filter((s) => s.status === "completed").length}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${sessions.filter((s) => s.status === "cancelled").length}</div>
            <div class="stat-label">Cancelled</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${Math.round(sessions.reduce((avg, s) => avg + (s.attendance_rate || 0), 0) / sessions.length || 0)}%</div>
            <div class="stat-label">Avg Attendance</div>
          </div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Trainer</th>
            <th>Category</th>
            <th>Status</th>
            <th>Location</th>
            <th>Participants</th>
            <th>Attendance</th>
          </tr>
        </thead>
        <tbody>
          ${sessions
            .map(
              (session) => `
            <tr>
              <td>${format(new Date(session.scheduled_start), "MMM dd, yyyy")}</td>
              <td>${format(new Date(session.scheduled_start), "HH:mm")}-${format(new Date(session.scheduled_end), "HH:mm")}</td>
              <td>${session.trainer_name || "N/A"}</td>
              <td><span class="category-${session.session_category?.toLowerCase() || "standard"}">${session.session_category || "Standard"}</span></td>
              <td><span class="status-${session.status}">${session.status}</span></td>
              <td>${session.location || "N/A"}</td>
              <td>${session.participant_count || 0}/${session.max_participants}</td>
              <td>${Math.round(session.attendance_rate || 0)}%</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Open in new window for printing (simplified approach)
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
};

// Email Report (would integrate with email service)
export const emailReport = async (
  sessions: SessionHistoryEntry[],
  recipient: string,
  exportFormat: "csv" | "pdf" = "csv"
) => {
  // This would integrate with your email service
  // For now, just prepare the data

  const reportData = {
    recipient,
    subject: `Training Sessions Report - ${format(new Date(), "MMMM dd, yyyy")}`,
    sessions: sessions.length,
    format: exportFormat,
    timestamp: new Date().toISOString(),
    summary: {
      total: sessions.length,
      completed: sessions.filter((s) => s.status === "completed").length,
      cancelled: sessions.filter((s) => s.status === "cancelled").length,
      avgAttendance: Math.round(
        sessions.reduce((avg, s) => avg + (s.attendance_rate || 0), 0) /
          sessions.length || 0
      ),
    },
  };

  console.log("Email report prepared:", reportData);

  // In production, call your email API here
  // await emailService.sendReport(reportData);

  return reportData;
};

// Print optimized table
export const printTable = (sessions: SessionHistoryEntry[]) => {
  const printStyles = `
    <style>
      @media print {
        body { 
          font-size: 12px; 
          margin: 0;
          padding: 20px;
        }
        table { 
          font-size: 10px;
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #000;
          padding: 4px;
          text-align: left;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .no-print { display: none; }
        .page-break { page-break-before: always; }
      }
    </style>
  `;

  const tableContent = document.querySelector("[data-print-table]")?.innerHTML;

  if (!tableContent) {
    // Fallback: create a simple table if no marked element found
    const simpleTable = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Trainer</th>
            <th>Status</th>
            <th>Participants</th>
            <th>Attendance</th>
          </tr>
        </thead>
        <tbody>
          ${sessions
            .map(
              (session) => `
            <tr>
              <td>${format(new Date(session.scheduled_start), "MMM dd")}</td>
              <td>${format(new Date(session.scheduled_start), "HH:mm")}</td>
              <td>${session.trainer_name}</td>
              <td>${session.status}</td>
              <td>${session.participant_count}/${session.max_participants}</td>
              <td>${Math.round(session.attendance_rate || 0)}%</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Training Sessions</title>
            ${printStyles}
          </head>
          <body>
            <h1>Training Sessions Report</h1>
            <p>Generated: ${format(new Date(), "MMMM dd, yyyy HH:mm")}</p>
            ${simpleTable}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  } else {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Training Sessions</title>
            ${printStyles}
          </head>
          <body>${tableContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  }
};
