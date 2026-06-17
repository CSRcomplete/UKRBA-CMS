"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { useTranslations } from "next-intl";
import { inviteUser } from "@/actions/admin/users/invite-user";

const FormSchema = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email(),
  language: z
    .string({
      message: "Please select a user language.",
    })
    .min(2),
});

export function InviteForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const t = useTranslations("AdminPage");

  const router = useRouter();


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      email: "",
      language: "en",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    try {
      const result = await inviteUser(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("inviteForm.invited"));
      }
    } catch (error) {
      toast.error(t("inviteForm.errorDesc"));
    } finally {
      form.reset({
        name: "",
        email: "",
        language: "en",
      });
      router.refresh();
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex space-x-5 w-full p-5 items-end"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="w-1/3">
              <FormLabel>{t("inviteForm.name")}</FormLabel>
              <FormControl>
                <Input disabled={isLoading} placeholder="jdoe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="w-1/3">
              <FormLabel>{t("inviteForm.email")}</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  placeholder="name@domain.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-[150px]" type="submit" disabled={isLoading}>
          {isLoading ? (
            <Icons.spinner className="animate-spin" />
          ) : (
            "Invite user"
          )}
        </Button>
      </form>
    </Form>
  );
}
