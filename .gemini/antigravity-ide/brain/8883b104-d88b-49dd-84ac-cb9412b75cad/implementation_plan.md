# Implementation Plan: Integration of Power BI Report "Mengenberechnung_V4" in Technik & Geräteverwaltung

Integrate the **Mengenberechnung_V4.pbix** Power BI report into the **Technik & Geräteverwaltung** module under the **Produktionsanlagen & Telemetrie** tab, replacing example data with the live, interactive report. 

As requested, the integration is designed around a **Single Master Account / Corporate License Architecture** (`App-Owns-Data` / Single Tenant Embed), ensuring that **all intranet users** can interact with the report without requiring individual Power BI licenses or logins.

---

## User Review Required

> [!IMPORTANT]
> **Single License & Embedded Access Strategy**
> Power BI reports cannot be rendered directly from a `.pbix` binary file inside a browser without a rendering engine. Power BI offers three standard enterprise methods for single-license intranet embedding:
>
> 1. **Option A: Power BI Service (Public / Secure iFrame Embed)**: The `.pbix` report is published to the corporate Power BI workspace using the single corporate master account. The secure embed URL (or Public Web Embed URL) is configured in system settings/`.env` (`POWERBI_EMBED_URL`). All intranet users view the interactive report instantly via the intranet proxy.
> 2. **Option B: Power BI Embedded API (App-Owns-Data / Master Account)**: Uses Azure AD / Service Principal authentication with a single master Power BI account to generate access tokens dynamically via the FastAPI backend and render the report using the official `@microsoft/powerbi-client` SDK.
> 3. **Option C: Power BI Report Server (On-Premises)**: If your company hosts Power BI Report Server locally, the report is hosted on `http://<local-report-server>/Reports/powerbi/Mengenberechnung_V4?rs:embed=true`.

> [!TIP]
> **Recommended Approach**: We will implement a flexible **Power BI Embedded Container Widget** with dynamic configuration. It will support both dynamic Embed URL/Token proxying and fallback local dataset summary rendering, allowing administrators to configure the single Power BI Embed URL/Token directly from the Intranet System Settings or `.env`.

---

## Open Questions

> [!IMPORTANT]
> 1. **Power BI Hosting & Embed URL**: Do you currently have a Power BI Service Workspace / Public Embed URL for `Mengenberechnung_V4.pbix`, or would you like us to configure a configurable Embed URL setting in the Intranet Settings panel?
> 2. **Report Height & Interactivity**: Would you prefer the report to occupy a full-screen interactive container with tab controls, export options, and full-screen toggle within the `Produktionsanlagen & Telemetrie` view?

---

## Proposed Changes

### Backend Component (`backend/`)

#### [NEW] [powerbi_service.py](file:///c:/Users/Humbert/Desktop/intranet-corp/backend/app/services/powerbi_service.py)
- Service helper to manage single-account Power BI embed tokens, master account configuration, and report metadata.
- Provides fallback endpoints for `.pbix` file registration and status checks.

#### [NEW] [powerbi.py](file:///c:/Users/Humbert/Desktop/intranet-corp/backend/app/api/v1/endpoints/powerbi.py)
- API endpoint `/api/v1/powerbi/mengenberechnung/config` returning the authenticated embed configuration for the master license account.

#### [MODIFY] [config.py](file:///c:/Users/Humbert/Desktop/intranet-corp/backend/app/core/config.py)
- Add environment variables for single Power BI master account:
  - `POWERBI_EMBED_URL`
  - `POWERBI_CLIENT_ID`
  - `POWERBI_TENANT_ID`
  - `POWERBI_CLIENT_SECRET`
  - `POWERBI_WORKSPACE_ID`
  - `POWERBI_REPORT_ID`

#### [MODIFY] [api.py](file:///c:/Users/Humbert/Desktop/intranet-corp/backend/app/api/v1/api.py)
- Register `/powerbi` router in backend API.

---

### Frontend Component (`frontend/`)

#### [NEW] [PowerBIReportWidget.jsx](file:///c:/Users/Humbert/Desktop/intranet-corp/frontend/src/components/technik/PowerBIReportWidget.jsx)
- Responsive Power BI container component featuring:
  - Full interactive iFrame / Power BI client embed with single-account master token authorization.
  - Interactive toolbar: Fullscreen mode, Refresh data, Print/Export, and Report Details.
  - Custom fallback loader & status badge confirming single master account connection.

#### [MODIFY] [TechnikPage.jsx](file:///c:/Users/Humbert/Desktop/intranet-corp/frontend/src/pages/TechnikPage.jsx)
- Replace static dummy machine cards in tab `PLANTS` (`Produktionsanlagen & Telemetrie`) with the live `<PowerBIReportWidget />` displaying the **Mengenberechnung_V4** report.

#### [MODIFY] [api.js](file:///c:/Users/Humbert/Desktop/intranet-corp/frontend/src/services/api.js)
- Add frontend API methods: `getPowerBiReportConfig()`.

---

## Verification Plan

### Automated Tests
- Build verification: Run `cmd /c "npm run build"` in `frontend/` to confirm clean compilation.
- Backend verification: Verify API route `/api/v1/powerbi/mengenberechnung/config` initializes without errors.

### Manual Verification
1. Navigate to **Technik & Geräteverwaltung** -> **Produktionsanlagen & Telemetrie**.
2. Confirm that static sample machine cards are replaced by the interactive **Mengenberechnung_V4** Power BI report container.
3. Test full-screen mode, interactive tab navigation, and responsiveness across light and dark themes.
4. Verify deployment to Homelab server (`192.168.1.29`).
