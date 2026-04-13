"use client";

import { useState } from "react";
import Link from "next/link";

type KycFile = { label: string; key: "aadhaar" | "selfie" | "property"; path: string | null };

export default function KycPage() {
  const [files, setFiles] = useState<Record<KycFile["key"], string | null>>({
    aadhaar: null,
    selfie: null,
    property: null,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function uploadOne(key: KycFile["key"], file: File | null) {
    if (!file) return;
    setErr(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/owner/kyc/upload", { method: "POST", body: form });
    const json = (await res.json()) as { path?: string; error?: string };
    if (!res.ok || !json.path) {
      setErr(json.error ?? "Upload failed");
      return;
    }
    setFiles((prev) => ({ ...prev, [key]: json.path! }));
  }

  async function submit() {
    setErr(null);
    setMsg(null);
    if (!files.aadhaar || !files.selfie || !files.property) {
      setErr("Please upload Aadhaar/ID, selfie, and property proof.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/owner/kyc/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aadhaarDocUrl: files.aadhaar,
        selfieUrl: files.selfie,
        propertyProofUrl: files.property,
      }),
    });
    const json = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setErr(json.error ?? "Failed to submit KYC");
      return;
    }
    setMsg("KYC submitted. Admin review is pending.");
  }

  const fields: KycFile[] = [
    { label: "Aadhaar / ID", key: "aadhaar", path: files.aadhaar },
    { label: "Selfie", key: "selfie", path: files.selfie },
    { label: "Property proof", key: "property", path: files.property },
  ];

  return (
    <main className="mx-auto max-w-2xl px-4 pb-10 pt-24">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Owner KYC Submission</h1>
        <Link href="/dashboard" className="text-sm text-electric-bright hover:underline">Dashboard</Link>
      </div>
      <p className="mb-6 text-sm text-txt-secondary">
        Upload all three documents to list spaces. Supported: JPG, PNG, WEBP, PDF.
      </p>

      <div className="space-y-4 rounded-xl border border-border-token bg-bg-surface p-4">
        {fields.map((f) => (
          <label key={f.key} className="block text-sm text-txt-secondary">
            {f.label}
            <input
              type="file"
              className="mt-2 block w-full text-sm"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={(e) => void uploadOne(f.key, e.target.files?.[0] ?? null)}
            />
            <span className="mt-1 block text-xs text-txt-muted">
              {f.path ? "Uploaded" : "Not uploaded"}
            </span>
          </label>
        ))}

        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Submitting..." : "Submit KYC"}
        </button>
      </div>

      {err ? <p className="mt-3 text-sm text-danger">{err}</p> : null}
      {msg ? <p className="mt-3 text-sm text-emerald">{msg}</p> : null}
    </main>
  );
}

