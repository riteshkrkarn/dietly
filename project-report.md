# Dietly — AI Nutrition Label Analyzer

## Table of Contents

| Chapter | Title | Pages |
|---:|---|---|
| 1 | Introduction | |
| 3 | Proposed System | |
| 4 | System Requirements and Technology Stack | |
| 5 | System Design and Architecture | |
| 6 | Implementation | |
| 7 | Testing | |
| 8 | Results | |
| 9 | Screenshots and Demonstration Evidence | |
| 10 | Conclusion and Future Enhancements | |
| 11 | References | |

> **Chapter numbering note:** The supplied contents outline skips Chapter 2. Confirm whether a chapter such as “Literature Review” or “Existing System” is required by your report format before finalizing the numbering and page numbers.

## Chapter 1: Introduction

Dietly is a web-based nutrition-label analysis application. It helps users understand a packaged food product by extracting nutrition information from a label image and presenting an assessment tied to a likely dietary goal.

The system combines optical character recognition (OCR) with a sequence of AI agents. The agents extract nutrient data, infer the user's likely intent, focus on relevant nutrients, and generate a verdict with supporting details. Users can also ask follow-up questions about a scanned product through a chat interface.

### Objectives

- Make nutrition-label information easier to understand.
- Provide goal-oriented analysis instead of a generic nutrition summary.
- Show the assumptions and nutrient values behind an assessment.
- Allow users to explore scan results through follow-up chat.

## Chapter 3: Proposed System

The proposed system provides a browser-based interface for scanning a nutrition-label image and reviewing its analysis. The user uploads an image, the backend extracts its text using Tesseract.js, and the text is processed by a multi-agent pipeline powered by Gemini.

The pipeline consists of a **Parser Agent**, **Intent Agent**, **Filter Agent**, and **Analysis Agent**. Its result includes extracted nutrient information, an inferred intent and assumption, relevant and filtered nutrients, and a verdict with concerns, positives, and a recommendation. Scan progress can be sent to the frontend using Server-Sent Events (SSE) and Socket.IO.

A separate chat feature accepts follow-up questions and can use product context from a scan.

## Chapter 4: System Requirements and Technology Stack

### Functional Requirements

- Accept an uploaded image of a nutrition label.
- Extract text from the image using OCR.
- Parse product, serving-size, and nutrient information.
- Infer a likely dietary intent and identify relevant nutrients.
- Return a verdict, analysis, concerns, positives, and recommendation.
- Support re-analysis with a different intent.
- Provide follow-up chat about a product.
- Display scan progress and errors to the user.

### Non-Functional Requirements

- Present results in a clear, responsive web interface.
- Handle invalid uploads and processing errors.
- Keep the Gemini API key in server-side configuration.
- Communicate progress during longer scans.
- Avoid presenting uncertain or missing label data as confirmed facts.

### Technology Stack

| Area | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| OCR | Tesseract.js |
| AI integration | Gemini 2.5 Flash through LangChain |
| Live updates | Server-Sent Events (SSE) and Socket.IO |
| HTTP communication | Fetch API |
| Database | MongoDB/Mongoose dependencies are present, but database connection is currently commented out in the server startup code |

## Chapter 5: System Design and Architecture

Dietly follows a client-server architecture. The React frontend sends scan and chat requests to an Express backend. For a scan, the backend receives an image, runs OCR, and passes the extracted text through the agent orchestrator. Gemini is used by the AI agents; the parser also has a regex-based fallback, while the intent and filtering agents include fallback paths.

### Nutrition Scan Pipeline

1. **Image upload:** The user selects or drops an image in the scanner.
2. **OCR:** Tesseract.js extracts text from the image.
3. **Parsing:** The Parser Agent converts OCR text into structured product and nutrient data.
4. **Intent inference:** The Intent Agent estimates the user's likely goal.
5. **Filtering:** The Filter Agent selects nutrients relevant to that goal.
6. **Analysis:** The Analysis Agent generates a verdict and explanation.
7. **Response:** The frontend displays the result and scan progress; users can request a re-analysis or ask follow-up questions.

The scan endpoint supports progress events through SSE and can also emit scan events through Socket.IO. The project includes MongoDB connection code, but it is not currently enabled in the server startup flow; do not depict a live database in the architecture unless you enable and verify it.

## Chapter 6: Implementation

The frontend provides the image-selection and scan experience, displays progress and results, and supports follow-up chat. The backend exposes Express routes for OCR, nutrition analysis, re-analysis, suggestions, and chat.

The scan-analysis flow is coordinated by an orchestrator that calls the four agents in sequence. AI responses are expected in JSON format. Fallback behavior is included for some parsing, intent inference, and nutrient filtering scenarios. The backend reads the Gemini API key from environment configuration.

Implementation details can be reviewed in the [project README](README.md), [scan controller](be/src/controllers/scan-controller.js), and [agent orchestrator](be/src/agent/orchestrator-agent.js).

## Chapter 7: Testing

Document the tests you actually perform and their results. The following checks are suggested:

| Test | Expected Result |
|---|---|
| Upload a clear nutrition-label image | OCR text is extracted and analysis is returned |
| Upload an unsupported or missing file | The user receives a clear validation error |
| Scan a label with incomplete information | The system reports only the data it can extract |
| Re-analyze with another intent | Nutrient relevance and analysis update for the selected intent |
| Ask a follow-up question | The chat returns a response, using product context when available |
| Test with the Gemini API unavailable | The relevant fallback behavior is exercised, or an explicit error is shown |
| Check progress during a scan | Progress updates appear and the final result is displayed |

The backend package currently has no configured test suite. Report automated test results only if you add and run tests. Describe the checks above as manual tests only after performing them.

## Chapter 8: Results

The system is designed to transform a nutrition-label image into structured nutrient data and a goal-oriented assessment. The output can include an inferred assumption, a verdict, an analysis, nutrient-specific concerns and positives, and a recommendation.

For the final report, include screenshots of the scanner and a successful result. Report measured observations—such as the number of test images that produced usable results—only after running those tests. Do not present example or expected behavior as measured results.

## Chapter 9: Screenshots and Demonstration Evidence

Include screenshots captured from the running application, such as:

- Home page and scanner entry point.
- Image selected before analysis.
- Scan progress or agent status updates.
- Completed result showing the verdict and nutrient details.
- Re-analysis using a different intent.
- Follow-up chat using product context.
- A validation or error state, if available.

Add a brief caption under each screenshot and remove personal or sensitive information from any sample labels.

## Chapter 10: Conclusion and Future Enhancements

Dietly demonstrates an end-to-end approach to nutrition-label interpretation, combining image-based text extraction, structured parsing, intent-aware filtering, and AI-generated analysis. Its agent pipeline and progress updates make the scanning process visible to the user.

Possible future improvements include:

- Enabling and testing persistent storage.
- Adding automated tests.
- Improving OCR accuracy for varied image quality.
- Adding user confirmation for uncertain extracted values.
- Evaluating analysis quality against a reviewed set of labels.
- Considering product-comparison features or external food databases.

## Chapter 11: References

Use the versions and access dates required by your report format.

1. Dietly project README and source code: [README.md](README.md).
2. React documentation: <https://react.dev/>.
3. Vite documentation: <https://vite.dev/guide/>.
4. Express documentation: <https://expressjs.com/>.
5. Tesseract.js project: <https://github.com/naptha/tesseract.js>.
6. Google Gemini API documentation: <https://ai.google.dev/gemini-api/docs>.
7. LangChain JS documentation: <https://docs.langchain.com/oss/javascript/langchain/overview>.

## Gemini Image-Generation Prompts

Use the following prompts to generate report illustrations. Check the generated diagrams for spelling and technical accuracy before including them.

### System Architecture Diagram

> Create a clean, professional **system architecture diagram** for a university software project report titled **“Dietly — AI Nutrition Label Analyzer.”** Use a white background, restrained green and navy palette, flat vector shapes, clear readable labels, and a landscape 16:9 layout. Show these components and connections in order:
>
> **User → React 19 + Vite web frontend (image upload, results, follow-up chat) → Node.js + Express backend API → Tesseract.js OCR → Agent Orchestrator → Parser Agent → Intent Agent → Filter Agent → Analysis Agent → Gemini 2.5 Flash via LangChain → structured analysis response → frontend.**
>
> Show the backend sending scan progress to the frontend using **SSE**, with **Socket.IO** as an additional scan-event channel. Include a separate chat request path from the frontend through the backend to the chat copilot and Gemini. Indicate that Gemini is an external AI service. Group components into **Client**, **Backend**, and **External AI Service** zones. Use directional arrows and ensure every label is spelled exactly as provided. Do not show a connected database: MongoDB connection code exists in the project but is not enabled at startup. Avoid decorative food imagery, invented components, and unnecessary detail. Make it suitable for direct inclusion in a technical report.

### System Design and Scan Workflow Diagram

> Create a report-ready **system workflow diagram** titled **“Dietly Nutrition Label Scan and Analysis Flow.”** Use a white background, simple green-and-navy academic infographic style, landscape layout, and clear readable text. Show the flow with numbered steps and directional arrows:
>
> 1. User selects or drops a nutrition-label image in the React web app.
> 2. Frontend uploads the image to the Express scan API.
> 3. Tesseract.js extracts label text.
> 4. Parser Agent extracts product name, serving size, and nutrients into structured data.
> 5. Intent Agent infers a likely user goal and states its assumption.
> 6. Filter Agent selects nutrients relevant to that goal.
> 7. Analysis Agent generates a verdict, explanation, concerns, positives, and recommendation using Gemini 2.5 Flash through LangChain.
> 8. Backend returns the result to the frontend and sends scan-progress updates using SSE / Socket.IO.
> 9. User can choose a different intent for re-analysis or ask follow-up questions in chat.
>
> Visually distinguish user actions, frontend, backend processing, AI agents, and final output. Keep the four agents in the correct sequence. Do not imply that MongoDB persistence is active, do not invent features, and keep text short, legible, and accurately spelled.

For best results, generate diagrams without tiny captions. If Gemini garbles any labels, use the generated image as a layout reference and recreate the labels in PowerPoint, draw.io, or another diagram editor.
