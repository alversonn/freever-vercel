"use client";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
    });
    setLoading(false);
    if (res?.ok) {
      router.push("/assessment"); // sukses → langsung ke assessment
    } else {
      setErr("Invalid username/email/phone or password.");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/freever-logo.png"
            alt="Freever"
            width={120}
            height={120}
            className="mb-2"
            priority
          />
          <h1 className="text-2xl font-bold text-blue-700">Welcome to Freever</h1>
          <p className="text-gray-500">Clinical Decision Support for Fever</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="identifier">Email / Phone / Username</Label>
            <Input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="mt-1"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              placeholder="••••••••"
            />
          </div>
          {err && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">
              {err}
            </p>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Signing in..." : "Login"}
          </Button>
        </form>

        <p className="text-sm text-center mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
