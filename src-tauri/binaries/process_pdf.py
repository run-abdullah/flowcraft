import re
import sys

import fitz  # PyMuPDF


def convert_time_str(match):
    full_str = match.group(0)
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
        # Get all text blocks with positions
        text_instances = page.get_text("blocks")

        for b in text_instances:
            block_text = b[4]
            if time_regex.search(block_text):
                # Search for specific matches on the page to get exact rects
                matches = time_regex.finditer(block_text)
                for m in matches:
                    found_text = m.group(0)
                    new_text = time_regex.sub(convert_time_str, found_text)

                    # Find coordinates of this text on the page
                    rects = page.search_for(found_text)
                    for rect in rects:
                        # Redact (cover) old text with a white rectangle
                        page.add_redact_annot(rect, fill=(1, 1, 1))
                        page.apply_redactions()

                        # Insert new 24-hour text at the exact same position
                        page.insert_text(
                            fitz.Point(rect.x0, rect.y1 - 2),
                            new_text,
                            fontsize=11,
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
