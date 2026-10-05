import { Bot } from "lucide-react";
import { NavItem } from "../nav-main";

type Props = {
  title: string;
};

export const getAutomationsMenuItem = ({ title }: Props): NavItem => {
  return {
    title,
    icon: Bot,
    items: [
      { title: "£5 Assessment Email Flow", url: "/automations/five-pound-assessment" },
    ],
  };
};

export default getAutomationsMenuItem;
