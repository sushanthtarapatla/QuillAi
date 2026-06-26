import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export async function generateDocx(projectName, docData) {
  // Split sections and helper for text blocks (remove markdown characters if possible for a cleaner docx)
  const cleanMd = (text) => {
    if (!text) return '';
    return text
      .replace(/[\#\*\_`\[\]]/g, '') // strip common formatting
      .replace(/\n\s*-\s+/g, '\n• ') // convert hyphens to bullets
      .trim();
  };

  const createHeading = (text, level) => {
    return new Paragraph({
      text,
      heading: level,
      spacing: { before: 200, after: 100 }
    });
  };

  const createBodyParagraph = (text) => {
    const lines = text.split('\n');
    return lines.map(line => {
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
      const cleanLine = line.replace(/^\s*[\-\•]\s*/, '').trim();
      
      return new Paragraph({
        children: [
          new TextRun({
            text: cleanLine,
            size: 24 // 12pt font
          })
        ],
        bullet: isBullet ? { level: 0 } : undefined,
        spacing: { before: 80, after: 80 }
      });
    });
  };

  const children = [
    new Paragraph({
      text: `${projectName} - Project Documentation`,
      heading: HeadingLevel.TITLE,
      spacing: { after: 300 }
    }),

    createHeading("1. Executive Summary", HeadingLevel.HEADING_1),
    ...createBodyParagraph(cleanMd(docData.summary)),

    createHeading("2. Technology Stack", HeadingLevel.HEADING_1),
    ...createBodyParagraph(cleanMd(docData.techStack)),

    createHeading("3. Folder Structure Explanation", HeadingLevel.HEADING_1),
    ...createBodyParagraph(cleanMd(docData.folderStructureExplanation)),

    createHeading("4. Installation & Setup Guide", HeadingLevel.HEADING_1),
    ...createBodyParagraph(cleanMd(docData.installationGuide)),

    createHeading("5. Key Features", HeadingLevel.HEADING_1),
    ...createBodyParagraph(cleanMd(docData.features)),

    createHeading("6. Architectural Overview", HeadingLevel.HEADING_1),
    ...createBodyParagraph(cleanMd(docData.architectureOverview)),

    createHeading("7. Sequence & Flow Diagrams (Mermaid)", HeadingLevel.HEADING_1),
    new Paragraph({
      children: [
        new TextRun({
          text: docData.mermaidDiagram,
          font: "Courier New",
          size: 20
        })
      ],
      spacing: { before: 120, after: 120 }
    }),

    createHeading("8. API Reference", HeadingLevel.HEADING_1),
    ...createBodyParagraph(cleanMd(docData.apiDocumentation || 'No API documentation generated.')),

    createHeading("9. Database Design & Schemas", HeadingLevel.HEADING_1),
    ...createBodyParagraph(cleanMd(docData.databaseExplanation || 'No database models or schemas detected.')),

    createHeading("10. Suggested Improvements & Security Review", HeadingLevel.HEADING_1),
    ...createBodyParagraph(cleanMd(docData.suggestedImprovements)),

    createHeading("11. Resume Project Descriptions (STAR Format)", HeadingLevel.HEADING_1),
    ...createBodyParagraph(cleanMd(docData.resumeProjectDescription)),

    createHeading("12. Candidate Interview Questions & Answers", HeadingLevel.HEADING_1),
    ...createBodyParagraph(cleanMd(docData.interviewQuestions))
  ];

  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  });

  return await Packer.toBuffer(doc);
}
