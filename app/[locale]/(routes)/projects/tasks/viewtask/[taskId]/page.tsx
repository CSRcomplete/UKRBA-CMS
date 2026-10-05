import { getTask } from "@/actions/projects/get-task";
import React from "react";
import moment from "moment";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

import { getDocuments } from "@/actions/documents/get-documents";
import { getTaskComments } from "@/actions/projects/get-task-comments";
import { getTaskDocuments } from "@/actions/projects/get-task-documents";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { TeamConversations } from "./components/team-conversation";
import { TaskDocumentRepositorySection } from "./components/TaskDocumentRepositorySection";
import { EditableTaskDescription } from "./components/EditableTaskDescription";
import { TaskChecklistSection } from "./components/TaskChecklistSection";

import TaskViewActions from "./components/TaskViewActions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Shield, User } from "lucide-react";
import { prismadb } from "@/lib/prisma";
import { getBoards } from "@/actions/projects/get-boards";
import { getSession } from "@/lib/auth-server";

type TaskPageProps = {
  params: Promise<{
    taskId: string;
  }>;
};

const TaskPage = async (props: TaskPageProps) => {
  const params = await props.params;
  const session = await getSession();
  const user = session?.user;

  const { taskId } = params;
  const task: any = await getTask(taskId);
  const [taskDocuments, documents, comments, boards] = await Promise.all([
    getTaskDocuments(taskId),
    getDocuments(),
    getTaskComments(taskId),
    getBoards(user?.id!),
  ]);
  const creatorUser = task?.createdBy
    ? await prismadb.users.findFirst({
        where: { id: task.createdBy },
        select: { name: true },
      })
    : null;

  //console.log(taskDocuments, "taskDocuments");

  return (
    <div className="flex flex-col w-full px-2">
      <Button variant="ghost" size="sm" className="mb-2 w-fit gap-1.5 text-muted-foreground" asChild>
        <Link href="/projects/tasks">
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
      </Button>
      <div className="flex flex-col md:flex-row w-full space-x-2 ">
      <div className="flex flex-col w-full md:w-2/3">
        <div className="w-full border rounded-lg mb-5">
          {/*           <pre>
            <code>{JSON.stringify(task, null, 2)}</code>
          </pre> */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Editable Trello-Style Task Description */}
              <EditableTaskDescription
                taskId={task.id}
                initialContent={task.content}
              />

              {/* Trello-Style Task Checklist */}
              <TaskChecklistSection
                taskId={task.id}
                initialChecklist={(task.tags as any)?.checklist || []}
              />

              <div className="pt-2 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start space-x-3 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                    <Calendar className="mt-0.5 h-4.5 w-4.5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Date created
                      </p>
                      <p className="text-sm font-medium">
                        {moment(task.createdAt).format("YYYY-MM-DD HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                    <Calendar className="mt-0.5 h-4.5 w-4.5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground">Date due</p>
                      <p className="text-sm font-medium">
                        {moment(task.dueDateAt).format("YYYY-MM-DD HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                    <Shield className="mt-0.5 h-4.5 w-4.5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground">Priority</p>
                      <Badge
                        variant={
                          task.priority === "high" ? `destructive` : `outline`
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                    <Shield className="mt-0.5 h-4.5 w-4.5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground">Status</p>
                      <Badge
                        variant={
                          task.taskStatus === "COMPLETE"
                            ? `destructive`
                            : `outline`
                        }
                      >
                        {task.taskStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                    <User className="mt-0.5 h-4.5 w-4.5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Assigned to
                      </p>
                      <p className="text-sm font-medium">
                        {task.assigned_user?.name || "Not assigned"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                    <User className="mt-0.5 h-4.5 w-4.5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Created by
                      </p>
                      <p className="text-sm font-medium">
                        {creatorUser?.name || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="space-x-2">
              <TaskViewActions
                taskId={taskId}
                boards={boards}
                initialData={task}
              />
            </CardFooter>
          </Card>
        </div>
        {/*         <pre>
          <code>{JSON.stringify(taskDocuments, null, 2)}</code>
        </pre> */}
        <TaskDocumentRepositorySection
          taskId={taskId}
          taskDocuments={taskDocuments as any}
          availableDocuments={documents as any}
        />
      </div>

      <div className="w-full md:w-1/3">
        <TeamConversations data={comments as any} taskId={task.id} />
      </div>
      </div>
    </div>
  );
};

export default TaskPage;
