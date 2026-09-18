import re
import sys
import pymupdf as fitz


def convert_time_str(match):
    hours = int(match.group(1))
    minutes = match.group(2)
    modifier = match.group(3).upper()

    if modifier == "P" and hours < 12:
        hours += 12
    if modifier == "A" and hours == 12:
        hours = 0

    return f"{hours:02}:{minutes}"


def process_pdf_file(input_path, output_path):
    doc = fitz.open(input_path)

    # Regex for matching 12-hour times like 02:30 PM, 8:00AM, etc.
    time_regex = re.compile(r"(\d{1,2})[:.](\d{2})\s*([AP])\.?M\.?", re.IGNORECASE)

    for page in doc:
        # Collect all redactions and insertions per page first
        replacements = []

        # Get detailed text information with font size
        text_page = page.get_text("dict")

        for block in text_page.get("blocks", []):
            if "lines" not in block:
                continue

            for line in block["lines"]:
                for span in line["spans"]:
                    text = span["text"]
                    font_size = span["size"]  # Auto-extract original font size

                    matches = list(time_regex.finditer(text))
                    if matches:
                        for m in matches:
                            found_text = m.group(0)
                            new_text = time_regex.sub(convert_time_str, found_text)

                            # Find exact bounding box for the match
                            rects = page.search_for(found_text)
                            for rect in rects:
                                replacements.append(
                                    {
                                        "rect": rect,
                                        "new_text": new_text,
                                        "fontsize": font_size,
                                    }
                                )

        # 1. Add all redaction annotations first
        for item in replacements:
            page.add_redact_annot(item["rect"], fill=(1, 1, 1))

        # 2. Apply redactions once per page to prevent layout breaking
        if replacements:
            page.apply_redactions()

        # 3. Insert new text using original font size
        for item in replacements:
            rect = item["rect"]
            # Position alignment according to original baseline
            baseline_y = rect.y1 - (rect.height * 0.15)

            page.insert_text(
                fitz.Point(rect.x0, baseline_y),
                item["new_text"],
                fontsize=item["fontsize"],  # Exact original font size
                color=(0, 0, 0),
            )

    doc.save(output_path)
    doc.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_pdf.py <input> <output>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    process_pdf_file(input_file, output_file)
