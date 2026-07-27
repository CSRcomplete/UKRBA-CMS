"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";

import { UserSearchCombobox } from "@/components/ui/user-search-combobox";
import { AccountSearchCombobox } from "@/components/ui/account-search-combobox";
import { updateLead } from "@/actions/crm/leads/update-lead";

//TODO: fix all the types
type ConfigItem = { id: string; name: string };

type NewTaskFormProps = {
  initialData: any;
  setOpen: (value: boolean) => void;
  leadSources: ConfigItem[];
  leadStatuses: ConfigItem[];
  leadTypes: ConfigItem[];
};

export function UpdateLeadForm({ initialData, setOpen, leadSources, leadStatuses, leadTypes }: NewTaskFormProps) {
  const t = useTranslations("CrmLeadForm");
  const c = useTranslations("Common");

  const formSchema = z.object({
    id: z.string(),
    firstName: z.string().optional().nullable().or(z.literal("")),
    lastName: z.string().optional().nullable().or(z.literal("")),
    company: z.string().optional().nullable().or(z.literal("")),
    jobTitle: z.string().optional().nullable().or(z.literal("")),
    email: z.string().optional().nullable().or(z.literal("")),
    phone: z.string().optional().nullable().or(z.literal("")),
    website: z.string().optional().nullable().or(z.literal("")),
    description: z.string().optional().nullable().or(z.literal("")),
    lead_source_id: z.string().optional().nullable().or(z.literal("")),
    lead_status_id: z.string().optional().nullable().or(z.literal("")),
    lead_type_id: z.string().optional().nullable().or(z.literal("")),
    refered_by: z.string().optional().nullable().or(z.literal("")),
    campaign: z.string().optional().nullable().or(z.literal("")),
    assigned_to: z.string().optional().nullable().or(z.literal("")),
    accountsIDs: z.string().optional().nullable().or(z.literal("")),
    change_reason: z.string().optional().nullable().or(z.literal("")),
  });

  type NewLeadFormValues = z.infer<typeof formSchema>;

  //TODO: fix this any
  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      id: initialData?.id || "",
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      company: initialData?.company || "",
      jobTitle: initialData?.jobTitle || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      website: initialData?.website || "",
      description: initialData?.description || "",
      lead_source_id: initialData?.lead_source_id ?? "",
      lead_status_id: initialData?.lead_status_id ?? "",
      lead_type_id: initialData?.lead_type_id ?? "",
      refered_by: initialData?.refered_by || "",
      campaign: initialData?.campaign || "",
      assigned_to: initialData?.assigned_to || "",
      accountsIDs: initialData?.accountsIDs || "",
      change_reason: "",
    },
  });

  const onSubmit = async (data: NewLeadFormValues) => {
    const result = await updateLead({
      ...data,
      lead_source_id: data.lead_source_id ?? undefined,
      lead_status_id: data.lead_status_id ?? undefined,
      lead_type_id: data.lead_type_id ?? undefined,
      assigned_to: data.assigned_to ?? undefined,
      accountIDs: data.accountsIDs ?? undefined,
      change_reason: data.change_reason || undefined,
    });
    if (result?.error) {
      form.setError("root.serverError", { message: result.error });
    } else {
      toast.success(t("updateSuccess"));
      setOpen(false);
    }
  };

  if (!initialData)
    return <div>{c("somethingWentWrong")}</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full px-4 md:px-10">
        <div className="w-full text-sm">
          <div className="pb-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("firstName")}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="Johny"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("lastName")}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="Walker"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("company")}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="UKRBA Inc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("jobTitle")}</FormLabel>
                    <FormControl>
                      <Input disabled={form.formState.isSubmitting} placeholder="CTO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input disabled={form.formState.isSubmitting} placeholder="https://example.com" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="johny@domain.com"
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
                  <FormItem>
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="+11 123 456 789"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{c("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={form.formState.isSubmitting}
                      placeholder="New NextCRM functionality"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lead_source_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("leadSource")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select source…" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadSources.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="refered_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("referredBy")}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="Johny Walker"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="campaign"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("campaign")}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="Social networks"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lead_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadTypes.map((lt) => (
                          <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{c("assignedTo")}</FormLabel>
                    <FormControl>
                      <UserSearchCombobox
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder={c("selectUser")}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lead_status_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select status…" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadStatuses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="accountsIDs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assignAccount")}</FormLabel>
                  <FormControl>
                    <AccountSearchCombobox
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder={t("assignAccountPlaceholder")}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("assigned_to") !== initialData.assigned_to && (
              <FormField
                control={form.control}
                name="change_reason"
                render={({ field }) => (
                  <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <FormLabel className="text-indigo-600 dark:text-indigo-400 font-semibold">
                      Reason for Ownership Transfer *
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={form.formState.isSubmitting}
                        placeholder="Please provide the operational reason for this ownership reassignment (e.g. Area Director changed region, postcode routing exception, etc.)"
                        required
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
        <div className="grid gap-2 py-5">
          {form.formState.errors.root?.serverError && (
            <p className="text-sm text-destructive" aria-live="polite">
              {form.formState.errors.root.serverError.message}
            </p>
          )}
          <Button disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? (
              <span className="flex items-center animate-pulse">
                {c("savingData")}
              </span>
            ) : (
              t("updateButton")
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
