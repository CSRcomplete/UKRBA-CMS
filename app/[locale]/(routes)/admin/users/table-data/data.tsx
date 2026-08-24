import { StopIcon, PauseIcon, PlayIcon } from "@radix-ui/react-icons";

export const statuses = [
  {
    value: "ACTIVE",
    label: "Active",
    icon: PlayIcon,
  },
  {
    value: "INACTIVE",
    label: "Inactive",
    icon: StopIcon,
  },
  {
    value: "PENDING",
    label: "Pending",
    icon: PauseIcon,
  },
];
export const roles = [
  {
    value: "admin",
    label: "Admin",
    icon: PlayIcon,
  },
  {
    value: "ceo",
    label: "CEO",
    icon: PlayIcon,
  },
  {
    value: "coo",
    label: "COO",
    icon: PlayIcon,
  },
  {
    value: "operations_director",
    label: "Operations Director",
    icon: PlayIcon,
  },
  {
    value: "regional_director",
    label: "Regional Director",
    icon: PauseIcon,
  },
  {
    value: "area_director",
    label: "Area Director",
    icon: PauseIcon,
  },
  {
    value: "channel_partner",
    label: "Channel Partner",
    icon: PauseIcon,
  },
  {
    value: "manager",
    label: "Manager",
    icon: PauseIcon,
  },
  {
    value: "user",
    label: "User",
    icon: StopIcon,
  },
];
