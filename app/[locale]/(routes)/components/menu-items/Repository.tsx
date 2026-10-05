import { FolderOpen } from "lucide-react"
import { NavItem } from "../nav-main"

interface GetRepositoryMenuItemProps {
  title: string
}

export default function getRepositoryMenuItem({
  title,
}: GetRepositoryMenuItemProps): NavItem {
  return {
    title,
    url: "/repository",
    icon: FolderOpen,
  }
}
