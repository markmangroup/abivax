# Email Dataset Extraction - 2026-03-02

## Overview
Complete extraction of all 166 emails from `data/abivax/emails_staging/emails_2026-03-02.json`.

**Extraction Date:** 2026-03-02  
**Total Emails Extracted:** 166 (100%)  
**Data Completeness:** 99.9%  

## Files Generated

### 1. **emails_2026-03-02_SUMMARY.md** (6.8 KB)
High-level statistics and analysis:
- Received vs. Sent breakdown (124 received, 42 sent)
- Folder distribution (inbox: 124, sent: 42)
- Top 20 senders and CC recipients
- Attachment inventory (195 files across 91 emails)
- Date range: 2026-02-16 to 2026-03-02
- Unique threads: 80

### 2. **emails_2026-03-02_extracted.json** (607 KB)
Structured JSON containing all 166 emails with complete fields:
```json
{
  "total_emails": 166,
  "extraction_date": "2026-03-02",
  "emails": [
    {
      "id": "...",
      "direction": "received|sent",
      "date": "2026-03-02T...",
      "subject": "...",
      "from": "...",
      "to": [...],
      "cc": [...],
      "bodyText": "...",
      "hasAttachments": true|false,
      "attachmentNames": [...],
      "threadId": "...",
      "folder": "inbox|sent"
    },
    ...
  ]
}
```

### 3. **emails_2026-03-02_extracted.csv** (523 KB)
Spreadsheet-friendly format with 166 rows (one per email) and 12 columns:
- All fields from the JSON file
- Lists (to, cc, attachmentNames) converted to semicolon-separated strings
- Suitable for pivot tables, filtering, and analysis in Excel/Sheets

### 4. **emails_2026-03-02_complete.md** (556 KB)
Markdown with all 166 email records in detailed format:
- Each email as a separate section with all fields
- Full body text preserved
- Easy to search and reference

## Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| id | string | Exchange message ID (unique identifier) |
| direction | enum | 'received' or 'sent' |
| date | datetime | ISO 8601 format with milliseconds |
| subject | string | Email subject line |
| from | string | Sender email address or display name |
| to | array | List of primary recipients |
| cc | array | List of CC'd recipients |
| bodyText | string | Full email body (HTML/plain text as stored) |
| hasAttachments | boolean | Whether email contains attachments |
| attachmentNames | array | List of attachment filenames |
| threadId | string | Conversation thread identifier |
| folder | enum | 'inbox' or 'sent' |

## Key Statistics

- **Total Records:** 166
- **Received:** 124 (74.7%)
- **Sent:** 42 (25.3%)
- **With Attachments:** 91 (54.8%)
- **Total Attachments:** 195
- **Unique Senders:** 53+
- **Unique Threads:** 80
- **Date Coverage:** 2026-02-16 to 2026-03-02 (15 days)

## Top Senders
1. Michael Markman (37 emails)
2. Camille Girard / KPMG (14 emails)
3. Hema Keshava (12 emails)
4. Jade Nguyen (10 emails)
5. Adobe (7 emails)
6. Denis Jankovic (6 emails)

## Most Common CC Recipients
1. Ben Alaya, Aymen (19 emails)
2. Hema Keshava (17 emails)
3. Michael Markman (17 emails)
4. Jade Nguyen (13 emails)
5. Fabio Cataldi (12 emails)

## Attachment Categories
- PNG images (signatures, screenshots): ~80
- PDF documents (procedures, approvals): ~50
- Excel files (data, matrices): ~30
- JPG images: ~20
- Word documents: ~10
- Other files: ~5

## Usage Notes

1. **For Analysis:** Use the CSV file for filtering, sorting, and pivot tables
2. **For Reference:** Use the complete markdown for detailed content review
3. **For Integration:** Use the JSON file for programmatic access
4. **For Summaries:** Use the summary markdown for statistics and patterns

## Data Quality

- **Completeness:** 99.9% (1991 of 1992 fields populated)
- **Encoding:** UTF-8 with BOM
- **Structure:** All 12 required fields present in every record
- **Validation:** All dates in ISO 8601 format, all arrays properly formatted

## Next Steps

- Perform downstream analysis on these 166 emails
- Cross-reference with other data sources (calendar, tasks, etc.)
- Identify key themes, decisions, and action items
- Track engagement patterns across senders/recipients
