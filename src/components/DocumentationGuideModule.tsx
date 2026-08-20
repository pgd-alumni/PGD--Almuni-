import React, { useState } from 'react';
import { BookOpen, Copy, Check, ExternalLink, Code, FileCode, Layers, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

export const DocumentationGuideModule: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const appsScriptCode = `
/**
 * ============================================================================
 * BUTEX PGD Alumni Group - Google Apps Script Backend (Code.gs)
 * Lifetime Free Solution for Google Sites & Google Sheets Integration
 * ============================================================================
 */

var SPREADSHEET_ID = "1uMOI8R1PHXxq59k8mWVe7dEqOe60sePKmULDWbwrDEg";

function doGet(e) {
  var action = e.parameter.action || "index";
  
  if (action === "getAlumni") {
    return ContentService.createTextOutput(JSON.stringify(getAlumniData()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "getJobs") {
    return ContentService.createTextOutput(JSON.stringify(getApprovedJobs()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "verify") {
    var roll = e.parameter.roll || "";
    return ContentService.createTextOutput(JSON.stringify(verifyAlumniByRoll(roll)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Serve Embedded HTML Web App for Google Sites
  var template = HtmlService.createTemplateFromFile("Index");
  return template.evaluate()
    .setTitle("BUTEX PGD Alumni Portal")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Read Raw Alumni Form Responses & Clean Data
 */
function getAlumniData() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheets()[0]; // Main Form Responses tab
  var data = sheet.getDataRange().getValues();
  var alumniList = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    alumniList.push({
      id: "BUTEX-PGD-" + (1000 + i),
      timestamp: row[0],
      name: row[1],
      email: row[2],
      phone: row[3],
      rollNo: row[4],
      company: row[5],
      designation: row[6],
      experience: row[7],
      address: row[8],
      university: row[9],
      photoUrl: row[11] || row[10], // Column L
      resumeUrl: row[12],           // Column M
      jobStatus: row[13]            // Column N
    });
  }
  return { status: "success", count: alumniList.length, data: alumniList };
}

/**
 * Read Approved Jobs (Posted within last 30 days)
 */
function getApprovedJobs() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("Job_Portal");
  if (!sheet) return { status: "success", count: 0, data: [] };

  var data = sheet.getDataRange().getValues();
  var jobs = [];
  var now = new Date();
  var thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var status = row[14]; // Status column
    var postedDate = new Date(row[15]);
    var deadline = new Date(row[10]);
    
    if (status === "Approved" && postedDate >= thirtyDaysAgo && deadline >= now) {
      jobs.push({
        id: row[0],
        title: row[1],
        company: row[2],
        source: row[3],
        url: row[4],
        location: row[5],
        category: row[6],
        skills: row[7],
        experience: row[8],
        salary: row[9],
        deadline: row[10],
        posterName: row[12],
        posterEmail: row[13]
      });
    }
  }
  return { status: "success", count: jobs.length, data: jobs };
}

/**
 * Verify Alumni by SL NO / Roll NO
 */
function verifyAlumniByRoll(rollNo) {
  var data = getAlumniData().data;
  var target = (rollNo || "").toString().toLowerCase().trim();
  
  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    if (item.rollNo && item.rollNo.toString().toLowerCase().indexOf(target) !== -1) {
      return { verified: true, alumni: item };
    }
  }
  return { verified: false, message: "Member not found" };
}

/**
 * Time-Driven Trigger: Refreshes every 6 hours and auto-expires old jobs
 */
function setup6HourTrigger() {
  // Clear existing triggers to prevent duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "run6HourAutoRefresh") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // Create new 6-hour recurring trigger
  ScriptApp.newTrigger("run6HourAutoRefresh")
    .timeBased()
    .everyHours(6)
    .create();
}

function run6HourAutoRefresh() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("Job_Portal");
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  var now = new Date();
  
  for (var i = 1; i < data.length; i++) {
    var deadline = new Date(data[i][10]);
    var status = data[i][14];
    
    if (deadline < now && status === "Approved") {
      sheet.getRange(i + 1, 15).setValue("Expired");
    }
  }
}
`;

  return (
    <div className="space-y-10 pb-16 w-full">
      
      {/* Page Title */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 space-y-4 border border-slate-800 shadow-2xl">
        <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400">
          <Sparkles className="w-4 h-4" />
          <span>Google Workspace Solution Architecture & Deployment Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          BUTEX PGD Alumni Portal Documentation
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          Complete blueprint covering System Architecture, Google Sheet Database Tabs, Apps Script Code, 6-Hour Auto Refresh, and Google Sites Step-by-Step Page Integration (Requirements A - N).
        </p>
      </div>

      {/* Section A: System Architecture */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center space-x-3 text-slate-900 font-extrabold text-lg border-b border-slate-100 pb-3">
          <Layers className="w-6 h-6 text-amber-600" />
          <h2>A. System Architecture</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The solution is engineered to operate 100% free-forever within Google’s Workspace Ecosystem:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Frontend Layer</span>
            <span className="text-slate-600">Google Sites (Embeds Apps Script Web App iframe with XFrameOptionsMode ALLOWALL)</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Backend & API Layer</span>
            <span className="text-slate-600">Google Apps Script Web App (Serves doGet JSON endpoints & HTML Service)</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Database Layer</span>
            <span className="text-slate-600">Google Sheets (ID: 1uMOI8R1PHXxq59k8mWVe7dEqOe60sePKmULDWbwrDEg)</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Form Data Collection</span>
            <span className="text-slate-600">Google Forms (For alumni registration & job submission)</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Automation Triggers</span>
            <span className="text-slate-600">6-Hour Time-Driven Apps Script Trigger (Auto-refreshes job cache & expires old posts)</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Email Notifications</span>
            <span className="text-slate-600">MailApp Service (Sends instant admin alerts for job submissions)</span>
          </div>
        </div>
      </section>

      {/* Section B & C: Recommended Google Sheet Tabs & Column Structures */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center space-x-3 text-slate-900 font-extrabold text-lg border-b border-slate-100 pb-3">
          <Code className="w-6 h-6 text-amber-600" />
          <h2>B & C. Recommended Google Sheet Tabs & Complete Column Structures</h2>
        </div>
        <div className="space-y-4 text-xs">
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
            <h4 className="font-bold text-slate-900 text-sm mb-2">Tab 1: Alumni_Responses (Live Sheet)</h4>
            <p className="text-slate-600 mb-2">Columns:</p>
            <p className="font-mono bg-slate-900 text-amber-300 p-3 rounded-xl overflow-x-auto">
              A: Timestamp | B: Name | C: Email | D: Phone No | E: PGD SL NO / ROLL NO | F: Current Industry / Company Name | G: Current Designation Status | H: Total Experience | I: Present Address | J: University Name - BSc & MSc / MBA / Others | K: Extra Info | L: Profile Picture URL | M: CV or Resume Link | N: Current Job Status
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
            <h4 className="font-bold text-slate-900 text-sm mb-2">Tab 2: Job_Portal (Job Submissions)</h4>
            <p className="text-slate-600 mb-2">Columns:</p>
            <p className="font-mono bg-slate-900 text-amber-300 p-3 rounded-xl overflow-x-auto">
              A: Job ID | B: Title | C: Company | D: Source | E: Original URL | F: Location | G: Category | H: Required Skills | I: Experience Required | J: Salary Range | K: Deadline | L: Job Description | M: Poster Name | N: Poster Email | O: Status (Pending/Approved/Expired) | P: Created At
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
            <h4 className="font-bold text-slate-900 text-sm mb-2">Tab 3: Events_Directory</h4>
            <p className="text-slate-600 mb-2">Columns:</p>
            <p className="font-mono bg-slate-900 text-amber-300 p-3 rounded-xl overflow-x-auto">
              A: Event ID | B: Title | C: Category | D: Date | E: Time | F: Venue | G: Description | H: Registered Count | I: Max Capacity | J: Status
            </p>
          </div>
        </div>
      </section>

      {/* Section E: Complete Apps Script Backend Code */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3 text-slate-900 font-extrabold text-lg">
            <FileCode className="w-6 h-6 text-amber-600" />
            <h2>E. Complete Google Apps Script Code (Code.gs)</h2>
          </div>
          <button
            onClick={() => copyText(appsScriptCode, 'appsscript')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
          >
            {copiedSection === 'appsscript' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSection === 'appsscript' ? 'Copied!' : 'Copy Code.gs'}</span>
          </button>
        </div>

        <pre className="bg-slate-950 text-amber-300 p-5 rounded-2xl font-mono text-xs overflow-x-auto max-h-96">
          {appsScriptCode}
        </pre>
      </section>

      {/* Section G: Google Sites Page-by-Page Setup Instructions */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center space-x-3 text-slate-900 font-extrabold text-lg border-b border-slate-100 pb-3">
          <BookOpen className="w-6 h-6 text-amber-600" />
          <h2>G. Google Sites Page-by-Page Insertion Instructions</h2>
        </div>

        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">1. Home Page</span>
            <span>Insert Embed Code: Insert Apps Script Web App URL or Embed iframe for live statistics & search bar.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">2. Alumni Directory Page</span>
            <span>Insert Embed Code: Embed <code className="bg-slate-200 px-1 rounded">?action=getAlumni</code> web app view.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">3. Job Portal Page</span>
            <span>Insert Embed Code: Embed <code className="bg-slate-200 px-1 rounded">?action=getJobs</code> web app view.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">4. Post a Job Page</span>
            <span>Insert Google Form Embed link or embedded Apps Script submission form.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">5. Admin Dashboard Page</span>
            <span>Make this page password-protected or restricted to admin Google Accounts via Google Sites page permission settings.</span>
          </div>
        </div>
      </section>

      {/* Section H, I, J: Automation & Refresh Trigger */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center space-x-3 text-slate-900 font-extrabold text-lg border-b border-slate-100 pb-3">
          <Terminal className="w-6 h-6 text-amber-600" />
          <h2>H, I, J. Automation & 6-Hour Time Trigger Setup</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          How to enable the automatic 6-hour refresh trigger in Google Apps Script:
        </p>
        <ol className="list-decimal list-inside text-xs space-y-2 text-slate-700 font-medium">
          <li>In your Google Sheet, click <strong>Extensions &gt; Apps Script</strong>.</li>
          <li>Paste the provided <code className="text-amber-800 bg-amber-50 px-1 font-bold">Code.gs</code>.</li>
          <li>In the left sidebar of Apps Script, click on <strong>Triggers (Clock icon)</strong>.</li>
          <li>Click <strong>+ Add Trigger</strong> in the bottom right corner.</li>
          <li>Select function to run: <code className="text-slate-900 font-bold">run6HourAutoRefresh</code>.</li>
          <li>Select event source: <code className="text-slate-900 font-bold">Time-driven</code>.</li>
          <li>Select type of time based trigger: <code className="text-slate-900 font-bold">Hour timer</code> &gt; <code className="text-slate-900 font-bold">Every 6 hours</code>.</li>
          <li>Click <strong>Save</strong> and grant authorization. Old jobs will now automatically expire every 6 hours!</li>
        </ol>
      </section>

      {/* Section K: New Member Google Sheet Join WhatsApp Webhook */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 text-slate-900 font-extrabold text-lg border-b border-slate-100 pb-3">
          <Terminal className="w-6 h-6 text-emerald-600" />
          <h2>K. New Member Google Sheet Join WhatsApp Webhook Setup</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          When new alumni register or fill out your Google Form, you can automatically broadcast a formatted WhatsApp notification to your Whapi group:
        </p>
        <div className="bg-slate-950 text-emerald-300 p-4 rounded-xl text-xs font-mono overflow-x-auto space-y-2 border border-slate-800">
          <p className="text-slate-400 text-[11px]">// Paste inside Google Apps Script Code.gs:</p>
          <pre>{`function onFormSubmit(e) {
  var values = e.values; // Submitted row from Google Form
  var payload = {
    name: values[1] || "New Alumni Member",
    email: values[2] || "",
    phone: values[3] || "",
    rollNo: values[4] || "PGD Alumni",
    company: values[5] || "",
    designation: values[6] || ""
  };
  
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch('YOUR_PORTAL_URL/api/alumni/member-join', options);
}`}</pre>
        </div>
        <p className="text-xs text-slate-600">
          Add an <strong>On form submit</strong> trigger in Apps Script to run <code className="font-bold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">onFormSubmit</code> automatically whenever anyone joins!
        </p>
      </section>

    </div>
  );
};
