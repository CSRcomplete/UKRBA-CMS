import { CalendarDays } from "lucide-react";
import { NavItem } from "../nav-main";

type Props = {
  title: string;
};

export const getDiaryMenuItem = ({ title }: Props): NavItem => {
  return {
    title,
    url: "/calendar",
    icon: CalendarDays,
  };
};

export default getDiaryMenuItem;
