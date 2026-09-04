"use client";

import { useRef, useState } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { WEB3FORMS_HCAPTCHA_SITE_KEY } from "@/lib/constants";
import { SITE, whatsappUrl } from "@/lib/site";

export function ContactForm() {
  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
  const captchaRef = useRef<HCaptcha>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    if (!accessKey) {
      toast.error("Contact form is not configured yet. Please use WhatsApp or email.");
      return;
    }

    if (data.get("botcheck") === "on") {
      return;
    }

    if (!captchaToken) {
      toast.error("Please complete the captcha before sending.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `Vita Glow contact from ${data.get("name")}`,
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          message: data.get("message"),
          "h-captcha-response": captchaToken,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed");
      toast.success("Message sent. We'll get back to you soon.");
      form.reset();
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } catch {
      toast.error("Could not send message. Try WhatsApp instead.");
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-[1.5rem] border border-border bg-card p-6 shadow-sm">
      <input
        type="checkbox"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="Your name" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="you@email.com" />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" placeholder={SITE.phoneDisplay} />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required placeholder="How can we help?" />
      </div>
      {accessKey ? (
        <div className="overflow-hidden rounded-xl border border-border bg-zinc-50/80 p-3">
          <HCaptcha
            ref={captchaRef}
            sitekey={WEB3FORMS_HCAPTCHA_SITE_KEY}
            reCaptchaCompat={false}
            onVerify={setCaptchaToken}
            onExpire={() => setCaptchaToken(null)}
          />
        </div>
      ) : null}
      <Button
        type="submit"
        disabled={loading || (Boolean(accessKey) && !captchaToken)}
        className="w-full"
      >
        {loading ? "Sending…" : "Send message"}
      </Button>
      <p className="text-center text-xs text-muted">
        Or{" "}
        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink underline"
        >
          chat on WhatsApp
        </a>
        {" · "}
        <a href={`mailto:${SITE.email}`} className="text-ink underline">
          email {SITE.email}
        </a>
      </p>
    </form>
  );
}
