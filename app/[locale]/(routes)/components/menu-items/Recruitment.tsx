import { Briefcase } from "lucide-react";
import { NavItem } from "../nav-main";

type Props = {
  title: string;
};

export const getRecruitmentMenuItem = ({ title }: Props): NavItem => {
  return {
    title,
    url: "/recruitment",
    icon: Briefcase,
  };
};

export default getRecruitmentMenuItem;
