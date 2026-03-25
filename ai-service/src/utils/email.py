"""
Serviço de envio de emails via Brevo (SendInBlue)
Usado para verificação de email e recuperação de password
"""
import requests
import random
import string
import os

# ==================== CONFIGURAÇÃO BREVO ====================
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
BREVO_FROM_EMAIL = os.getenv("BREVO_FROM_EMAIL", "noreply@laphis.app")
BREVO_FROM_NAME = os.getenv("BREVO_FROM_NAME", "LAPHIS Fitness")

# Em dev, se não houver API key, printa no console
DEV_MODE = not BREVO_API_KEY


def generate_code(length: int = 6) -> str:
    """Gera código numérico aleatório (ex: 482917)"""
    return "".join(random.choices(string.digits, k=length))


def generate_token(length: int = 32) -> str:
    """Gera token aleatório seguro para reset de password"""
    return "".join(random.choices(string.ascii_letters + string.digits, k=length))


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Envia email via Brevo API.
    Em DEV_MODE (sem API key), apenas printa no console.
    """
    if DEV_MODE:
        print("\n" + "=" * 60)
        print("📧 EMAIL (DEV MODE — sem Brevo configurado)")
        print(f"   Para: {to_email}")
        print(f"   Assunto: {subject}")
        print(f"   ---")
        import re
        text = re.sub(r'<[^>]+>', ' ', html_body)
        text = re.sub(r'\s+', ' ', text).strip()
        print(f"   {text[:300]}")
        print("=" * 60 + "\n")
        return True

    try:
        headers = {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json"
        }
        
        payload = {
            "sender": {
                "name": BREVO_FROM_NAME,
                "email": BREVO_FROM_EMAIL
            },
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_body
        }

        response = requests.post(BREVO_API_URL, json=payload, headers=headers, timeout=10)
        
        if response.status_code in [200, 201]:
            print(f"✅ Email enviado para {to_email} via Brevo")
            return True
        else:
            print(f"❌ Brevo error ({response.status_code}): {response.text}")
            return False

    except Exception as e:
        print(f"❌ Erro ao enviar email para {to_email}: {e}")
        return False



def send_verification_email(to_email: str, code: str) -> bool:
    """Envia email com código de verificação de conta"""
    subject = "🔐 LAPHIS — Verifica o teu email"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: #9B6A4A; color: white; font-size: 26px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(155,106,74,0.25);">L</div>
        <h1 style="font-size: 22px; color: #4A3427; margin: 16px 0 4px;">Verifica o teu email</h1>
        <p style="color: #8B7355; font-size: 14px; margin: 0;">Introduz este código na app para ativar a tua conta</p>
      </div>

      <div style="background: #F5F0EB; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #9B6A4A; margin: 0;">{code}</p>
      </div>

      <p style="color: #8B7355; font-size: 13px; text-align: center;">
        Este código expira em <strong>15 minutos</strong>.<br>
        Se não criaste esta conta, ignora este email.
      </p>
    </div>
    """
    return _send_email(to_email, subject, html)


def send_reset_password_email(to_email: str, code: str) -> bool:
    """Envia email com código para recuperar password"""
    subject = "🔑 LAPHIS — Recuperar Password"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: #9B6A4A; color: white; font-size: 26px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(155,106,74,0.25);">L</div>
        <h1 style="font-size: 22px; color: #4A3427; margin: 16px 0 4px;">Recuperar Password</h1>
        <p style="color: #8B7355; font-size: 14px; margin: 0;">Introduz este código na app para definir uma nova password</p>
      </div>

      <div style="background: #F5F0EB; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #9B6A4A; margin: 0;">{code}</p>
      </div>

      <p style="color: #8B7355; font-size: 13px; text-align: center;">
        Este código expira em <strong>15 minutos</strong>.<br>
        Se não pediste para recuperar a password, ignora este email.
      </p>
    </div>
    """
    return _send_email(to_email, subject, html)
