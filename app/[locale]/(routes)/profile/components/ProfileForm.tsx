"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/user/update-profile";

interface ProfileFormProps {
  data: any;
}

const FormSchema = z.object({
  id: z.string(),
  name: z.string().min(3).max(50),
  username: z.string().min(2).max(50),
  account_name: z.string().min(2).max(50),
  phone: z.string().max(30).optional().or(z.literal("")),
});

export function ProfileForm({ data }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const t = useTranslations("ProfileForm");

  const router = useRouter();


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: data
      ? { ...data, phone: data.phone ?? "" }
      : {
          name: "",
          username: "",
          account_name: "",
          phone: "",
        },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setIsLoading(true);
      const result = await updateProfile({
        userId: data.id,
        name: data.name,
        username: data.username,
        account_name: data.account_name,
        phone: data.phone,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Profile saved successfully");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong while activating your notion integration.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-wrap gap-5 w-full p-5 items-end"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="w-[calc(25%-1.25rem)] min-w-[160px]">
              <FormLabel>{t("fullName")}</FormLabel>
              <FormControl>
                <Input disabled={isLoading} placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="w-[calc(25%-1.25rem)] min-w-[160px]">
              <FormLabel>{t("username")}</FormLabel>
              <FormControl>
                <Input disabled={isLoading} placeholder="jdoe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="account_name"
          render={({ field }) => (
            <FormItem className="w-[calc(25%-1.25rem)] min-w-[160px]">
              <FormLabel>{t("company")}</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  placeholder="Tesla Inc.,"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem className="w-[calc(25%-1.25rem)] min-w-[160px]">
              <FormLabel>{t("phone")}</FormLabel>
              <FormControl>
                <Input disabled={isLoading} placeholder="+44 7700 900000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-[150px]" type="submit">
          {t("updateButton")}
        </Button>
      </form>
    </Form>
  );
}
