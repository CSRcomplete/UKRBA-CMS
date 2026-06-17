"use client";

import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { adminUserSchema } from "../table-data/schema";
import { useRouter } from "next/navigation";
import AlertModal from "@/components/modals/alert-modal";
import { useState } from "react";
import { toast } from "sonner";

import { Copy, Edit, MoreHorizontal, Shield, Trash, UserCheck, UserX, Network } from "lucide-react";
import { deleteUser } from "@/actions/admin/users/delete-user";
import { activateUser } from "@/actions/admin/users/activate-user";
import { deactivateUser } from "@/actions/admin/users/deactivate-user";
import { setUserRole } from "@/actions/admin/users/set-role";
import { updateUserHierarchy } from "@/actions/admin/users/update-hierarchy";
import { getHierarchyOptions } from "@/actions/admin/users/get-hierarchy-options";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const data = adminUserSchema.parse(row.original);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [isHierarchyOpen, setIsHierarchyOpen] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string | null; role: string; email: string }[]>([]);
  const [selectedParentId, setSelectedParentId] = useState(data.parentId || "none");
  const [selectedRegionId, setSelectedRegionId] = useState(data.region_id?.toString() || "");
  const [selectedAreaId, setSelectedAreaId] = useState(data.area_id?.toString() || "");

  useEffect(() => {
    if (isHierarchyOpen) {
      const fetchUsers = async () => {
        try {
          const list = await getHierarchyOptions();
          setUsers(list);
        } catch (e) {
          console.error("Failed to load hierarchy options", e);
        }
      };
      fetchUsers();
    }
  }, [isHierarchyOpen]);

  const onSaveHierarchy = async () => {
    try {
      setLoading(true);
      const parentVal = selectedParentId === "none" ? null : selectedParentId;
      const regionVal = selectedRegionId ? parseInt(selectedRegionId, 10) : null;
      const areaVal = selectedAreaId ? parseInt(selectedAreaId, 10) : null;

      const result = await updateUserHierarchy(data.id, parentVal, regionVal, areaVal);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User hierarchy and routing details updated.");
      setIsHierarchyOpen(false);
    } catch (error) {
      toast.error("Failed to update hierarchy: " + error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSupervisors = users.filter((u) => {
    if (u.id === data.id) return false;
    if (data.role === "operations_director") {
      return u.role === "ceo" || u.role === "admin";
    }
    if (data.role === "regional_director") {
      return u.role === "operations_director" || u.role === "ceo" || u.role === "admin";
    }
    if (data.role === "area_director") {
      return u.role === "regional_director";
    }
    if (data.role === "channel_partner") {
      return u.role === "area_director";
    }
    return u.role === "ceo" || u.role === "admin" || u.role === "operations_director";
  });

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("The URL has been copied to your clipboard.");
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      const result = await deleteUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User has been deleted");
    } catch (error) {
      toast.error("Something went wrong: " + error + ". Please try again.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const onActivate = async () => {
    try {
      setLoading(true);
      const result = await activateUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User has been activated.");
    } catch (error) {
      toast.error("Something went wrong while activating user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDeactivate = async () => {
    try {
      setLoading(true);
      const result = await deactivateUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User has been deactivated.");
    } catch (error) {
      toast.error("Something went wrong while deactivating user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSetRole = async (role: any) => {
    try {
      setLoading(true);
      const result = await setUserRole(data.id, role);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success(`User role changed to ${role}.`);
    } catch (error) {
      toast.error("Something went wrong while changing role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"ghost"} className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onCopy(data?.id)}>
            <Copy className="mr-2 w-4 h-4" />
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onActivate()}>
            <UserCheck className="mr-2 w-4 h-4" />
            Activate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDeactivate()}>
            <UserX className="mr-2 w-4 h-4" />
            Deactivate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsHierarchyOpen(true)}>
            <Network className="mr-2 w-4 h-4" />
            Manage Hierarchy
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Shield className="mr-2 w-4 h-4" />
              Set Role
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onSetRole("admin")}>
                Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRole("ceo")}>
                CEO
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRole("operations_director")}>
                Operations Director
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRole("regional_director")}>
                Regional Director
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRole("area_director")}>
                Area Director
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRole("channel_partner")}>
                Channel Partner
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRole("manager")}>
                Manager
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRole("user")}>
                User
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="mr-2 w-4 h-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={isHierarchyOpen} onOpenChange={setIsHierarchyOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Hierarchy & Routing</DialogTitle>
            <DialogDescription>
              Assign a supervisor/manager and specify region/area IDs for {data.name || data.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supervisor" className="text-right">
                Supervisor
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedParentId}
                  onValueChange={setSelectedParentId}
                >
                  <SelectTrigger id="supervisor">
                    <SelectValue placeholder="Select supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Unassigned)</SelectItem>
                    {filteredSupervisors.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="region" className="text-right">
                Region ID
              </Label>
              <Input
                id="region"
                type="number"
                value={selectedRegionId}
                onChange={(e) => setSelectedRegionId(e.target.value)}
                placeholder="e.g. 1"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="area" className="text-right">
                Area ID
              </Label>
              <Input
                id="area"
                type="number"
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                placeholder="e.g. 100"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsHierarchyOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={onSaveHierarchy} disabled={loading}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
