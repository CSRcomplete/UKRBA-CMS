import React from "react";
import Container from "../../components/ui/Container";
import { getTasks } from "@/actions/projects/get-tasks";
import { getBoards } from "@/actions/projects/get-boards";
import NewTaskDialog from "../dialogs/NewTask";
import { TasksDataTable } from "./components/data-table";
import { columns } from "./components/columns";

import { getTranslations } from "next-intl/server";

const TasksPage = async () => {
  const tasks: any = await getTasks();
  const boards: any = await getBoards();
  const t = await getTranslations("ProjectsPage");

  return (
    <Container
      title={t("tasks.title")}
      description={t("tasks.description")}
    >
      <div className="py-5">
        <NewTaskDialog boards={boards} />
      </div>
      <div>
        <TasksDataTable data={tasks} columns={columns} />
      </div>
    </Container>
  );
};

export default TasksPage;
