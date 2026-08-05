"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { KeyRound, Mail } from "lucide-react";
import Link from "next/link";

export function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    if (!agreedToTerms) {
      toast.error("You must agree to the Terms & Conditions to sign in.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password: password.trim(),
        callbackURL: "/",
      });

      if (error) {
        toast.error(error.message || "Failed to sign in. Please check your credentials.");
        return;
      }

      toast.success("Login successful!");
      window.location.href = "/";
    } catch (error) {
      console.error("[LOGIN_ERROR]", error);
      toast.error("An unexpected error occurred during sign-in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg my-5 max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>
          Enter your internal credentials to access the CRM
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <KeyRound className="h-3.5 w-3.5" /> Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="flex items-start gap-2 pt-1">
            <Checkbox
              id="agree-terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              disabled={isLoading}
            />
            <Label htmlFor="agree-terms" className="text-xs font-normal leading-snug text-muted-foreground">
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="underline hover:text-foreground">
                Terms &amp; Conditions
              </Link>
            </Label>
          </div>

          <Button type="submit" className="w-full mt-4" disabled={isLoading || !agreedToTerms}>
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
