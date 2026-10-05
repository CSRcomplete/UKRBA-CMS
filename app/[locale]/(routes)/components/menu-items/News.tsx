import { Megaphone } from "lucide-react";
import { NavItem } from "../nav-main";

type Props = {
  title: string;
};

export const getNewsMenuItem = ({ title }: Props): NavItem => {
  return {
    title,
    url: "/news",
    icon: Megaphone,
  };
};

export default getNewsMenuItem;
