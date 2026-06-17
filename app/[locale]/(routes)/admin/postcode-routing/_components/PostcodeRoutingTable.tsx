"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  createPostcodeRoute, updatePostcodeRoute, deletePostcodeRoute
} from "../actions";

import { getHierarchyOptions } from "@/actions/admin/users/get-hierarchy-options";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

interface PostcodeRoute {
  id: string;
  postcode_area: string;
  area_name?: string | null;
  region_country: string;
  assigned_region_id: number;
  area_directors?: {
    area_director: {
      id: string;
      name: string | null;
      email: string;
    };
  }[];
}

export function PostcodeRoutingTable({ initialRoutes }: { initialRoutes: PostcodeRoute[] }) {
  const [routes, setRoutes] = useState<PostcodeRoute[]>(initialRoutes);
  const [searchQuery, setSearchQuery] = useState("");
  const [areaDirectors, setAreaDirectors] = useState<{ id: string; name: string | null; email: string }[]>([]);

  // Create state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [postcodeArea, setPostcodeArea] = useState("");
  const [areaName, setAreaName] = useState("");
  const [regionCountry, setRegionCountry] = useState("England");
  const [assignedRegionId, setAssignedRegionId] = useState(1);
  const [areaDirectorIds, setAreaDirectorIds] = useState<string[]>([]);

  // Edit state
  const [editingRoute, setEditingRoute] = useState<PostcodeRoute | null>(null);
  const [editPostcodeArea, setEditPostcodeArea] = useState("");
  const [editAreaName, setEditAreaName] = useState("");
  const [editRegionCountry, setEditRegionCountry] = useState("");
  const [editAssignedRegionId, setEditAssignedRegionId] = useState(1);
  const [editAreaDirectorIds, setEditAreaDirectorIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchADs = async () => {
      try {
        const allUsers = await getHierarchyOptions();
        const ads = allUsers.filter((u) => u.role === "area_director");
        setAreaDirectors(ads);
      } catch (e) {
        console.error("Failed to load Area Directors", e);
      }
    };
    fetchADs();
  }, []);

  // Filter routes based on search query
  const filteredRoutes = routes.filter((r) =>
    r.postcode_area.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.area_name && r.area_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    r.region_country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postcodeArea || !regionCountry || !assignedRegionId) {
      toast.error("Please fill in all fields");
      return;
    }

    const res = await createPostcodeRoute({
      postcode_area: postcodeArea,
      area_name: areaName || null,
      region_country: regionCountry,
      assigned_region_id: assignedRegionId,
      area_director_ids: areaDirectorIds,
    });

    if (res.error) {
      toast.error(res.error);
    } else if (res.route) {
      toast.success(`Rule for area ${res.route.postcode_area} created`);
      setRoutes((prev) => [...prev, res.route as PostcodeRoute].sort((a, b) => a.postcode_area.localeCompare(b.postcode_area)));
      setIsAddOpen(false);
      setPostcodeArea("");
      setAreaName("");
      setRegionCountry("England");
      setAssignedRegionId(1);
      setAreaDirectorIds([]);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute || !editPostcodeArea || !editRegionCountry || !editAssignedRegionId) {
      toast.error("Please fill in all fields");
      return;
    }

    const res = await updatePostcodeRoute(editingRoute.id, {
      postcode_area: editPostcodeArea,
      area_name: editAreaName || null,
      region_country: editRegionCountry,
      assigned_region_id: editAssignedRegionId,
      area_director_ids: editAreaDirectorIds,
    });

    if (res.error) {
      toast.error(res.error);
    } else if (res.route) {
      toast.success(`Rule for area ${res.route.postcode_area} updated`);
      setRoutes((prev) =>
        prev.map((r) => (r.id === editingRoute.id ? (res.route as PostcodeRoute) : r))
          .sort((a, b) => a.postcode_area.localeCompare(b.postcode_area))
      );
      setEditingRoute(null);
    }
  };

  const handleDelete = async (id: string, area: string) => {
    if (!confirm(`Are you sure you want to delete the routing rule for ${area}?`)) {
      return;
    }

    const res = await deletePostcodeRoute(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Rule for area ${area} deleted`);
      setRoutes((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const startEdit = (route: PostcodeRoute) => {
    setEditingRoute(route);
    setEditPostcodeArea(route.postcode_area);
    setEditAreaName(route.area_name || "");
    setEditRegionCountry(route.region_country);
    setEditAssignedRegionId(route.assigned_region_id);
    setEditAreaDirectorIds(route.area_directors?.map((ad) => ad.area_director.id) || []);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search postcode area or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Add Button */}
        <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Postcode Rule
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Postcode Area</TableHead>
              <TableHead>Area Name</TableHead>
              <TableHead>Region/Country</TableHead>
              <TableHead>Assigned Region ID</TableHead>
              <TableHead>Area Director</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoutes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No postcode routing rules found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRoutes.map((route) => {
                const directorsText = route.area_directors && route.area_directors.length > 0
                  ? route.area_directors.map((ad) => ad.area_director.name || ad.area_director.email).join(", ")
                  : "Unassigned";
                return (
                  <TableRow key={route.id}>
                    <TableCell className="font-semibold">{route.postcode_area}</TableCell>
                    <TableCell>{route.area_name || "N/A"}</TableCell>
                    <TableCell>{route.region_country}</TableCell>
                    <TableCell>{route.assigned_region_id}</TableCell>
                    <TableCell>{directorsText}</TableCell>
                    <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(route)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(route.id, route.postcode_area)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Postcode Routing Rule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="postcode_area">Postcode Area Prefix</Label>
              <Input
                id="postcode_area"
                placeholder="e.g. EH or AL"
                value={postcodeArea}
                onChange={(e) => setPostcodeArea(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="area_name">Area Name</Label>
              <Input
                id="area_name"
                placeholder="e.g. Aberdeen or Bath"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="region_country">Country / Region Group</Label>
              <Input
                id="region_country"
                placeholder="e.g. Scotland or England"
                value={regionCountry}
                onChange={(e) => setRegionCountry(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="assigned_region_id">Assigned Region ID</Label>
              <Input
                id="assigned_region_id"
                type="number"
                value={assignedRegionId}
                onChange={(e) => setAssignedRegionId(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned Area Directors</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                {areaDirectors.map((d) => (
                  <div key={d.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`ad-${d.id}`}
                      checked={areaDirectorIds.includes(d.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAreaDirectorIds((prev) => [...prev, d.id]);
                        } else {
                          setAreaDirectorIds((prev) => prev.filter((id) => id !== d.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor={`ad-${d.id}`} className="font-normal cursor-pointer">
                      {d.name || d.email}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Rule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRoute} onOpenChange={(open) => !open && setEditingRoute(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Postcode Routing Rule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit_postcode_area">Postcode Area Prefix</Label>
              <Input
                id="edit_postcode_area"
                value={editPostcodeArea}
                onChange={(e) => setEditPostcodeArea(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit_area_name">Area Name</Label>
              <Input
                id="edit_area_name"
                placeholder="e.g. Aberdeen or Bath"
                value={editAreaName}
                onChange={(e) => setEditAreaName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit_region_country">Country / Region Group</Label>
              <Input
                id="edit_region_country"
                value={editRegionCountry}
                onChange={(e) => setEditRegionCountry(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit_assigned_region_id">Assigned Region ID</Label>
              <Input
                id="edit_assigned_region_id"
                type="number"
                value={editAssignedRegionId}
                onChange={(e) => setEditAssignedRegionId(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned Area Directors</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                {areaDirectors.map((d) => (
                  <div key={d.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit-ad-${d.id}`}
                      checked={editAreaDirectorIds.includes(d.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditAreaDirectorIds((prev) => [...prev, d.id]);
                        } else {
                          setEditAreaDirectorIds((prev) => prev.filter((id) => id !== d.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor={`edit-ad-${d.id}`} className="font-normal cursor-pointer">
                      {d.name || d.email}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingRoute(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
