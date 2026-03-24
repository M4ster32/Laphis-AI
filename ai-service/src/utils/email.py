"""
Serviço de envio de emails via Gmail SMTP
Usado para verificação de email e recuperação de password
"""
import smtplib
import random
import string
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ==================== CONFIGURAÇÃO SMTP ====================
# Para usar Gmail:
# 1. Ativa 2FA na conta Google
# 2. Gera uma "App Password" em https://myaccount.google.com/apppasswords
# 3. Define as variáveis de ambiente:
#    export SMTP_EMAIL="teu-email@gmail.com"
#    export SMTP_PASSWORD="xxxx xxxx xxxx xxxx"  (App Password de 16 chars)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "LAPHIS Fitness")

# Em dev, se não houver SMTP configurado, printa no console
DEV_MODE = not SMTP_EMAIL or not SMTP_PASSWORD


def generate_code(length: int = 6) -> str:
    """Gera código numérico aleatório (ex: 482917)"""
    return "".join(random.choices(string.digits, k=length))


def generate_token(length: int = 32) -> str:
    """Gera token aleatório seguro para reset de password"""
    return "".join(random.choices(string.ascii_letters + string.digits, k=length))


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Envia email via SMTP.
    Em DEV_MODE (sem credenciais), apenas printa no console.
    """
    if DEV_MODE:
        print("\n" + "=" * 60)
        print("📧 EMAIL (DEV MODE — sem SMTP configurado)")
        print(f"   Para: {to_email}")
        print(f"   Assunto: {subject}")
        print(f"   ---")
        # Extrair texto visível do HTML de forma simples
        import re
        text = re.sub(r'<[^>]+>', ' ', html_body)
        text = re.sub(r'\s+', ' ', text).strip()
        print(f"   {text[:300]}")
        print("=" * 60 + "\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())

        print(f"✅ Email enviado para {to_email}")
        return True

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
