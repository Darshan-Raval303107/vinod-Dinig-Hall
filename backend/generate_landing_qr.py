import qrcode
import os

def generate_landing_qr(url, output_path):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    print(f"QR Code generated at {output_path} for URL: {url}")

if __name__ == "__main__":
    # Use a placeholder if no URL provided
    url = os.environ.get("NGROK_URL", "http://localhost:5173")
    output = os.path.join("backend", "static", "landing_qr.png")
    generate_landing_qr(url, output)
