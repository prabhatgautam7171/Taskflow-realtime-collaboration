import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import api from "../services/api";

import CreateTaskModal from "../components/CreateTaskModal";

import socket from "../socket";

import TaskDetailsModal from "../components/TaskDetailsModal";

import { useLocation } from "react-router-dom";

import { Pencil, Trash2, Eye } from "lucide-react";

const ProjectDetails = () => {

  const location = useLocation();

  const project = location.state?.project;

  const { id } = useParams();

  const [tasks, setTasks] = useState([]);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);

  const [users, setUsers] = useState([]);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {

      const { data } = await api.get("/users", {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });

      setUsers(data);

    } catch (error) {
      console.log(error);
    }
  };

  const createTaskHandler = async (taskData) => {
    try {

      const { data } = await api.post(
        "/tasks",
        {
          ...taskData,
          projectId: id,
        },
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      setTasks([data, ...tasks]);

      socket.emit("taskCreated", {
        projectId: id,
        task: data,
      });


    } catch (error) {
      console.log(error);
    }
  };

  const addCommentHandler = async (taskId, text) => {
    try {

      const { data } = await api.post(
        `/tasks/${taskId}/comment`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      const updatedTasks = tasks.map((task) =>
        task._id === taskId ? data : task
      );

      setTasks(updatedTasks);

      setSelectedTask(data);

    } catch (error) {
      console.log(error);
    }
  };

  const assignTaskHandler = async (taskId, userId) => {
    try {

      const { data } = await api.put(
        `/tasks/${taskId}/assign`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      const updatedTasks = tasks.map((task) =>
        task._id === taskId ? data : task
      );

      setTasks(updatedTasks);

      setSelectedTask(data);

    } catch (error) {
      console.log(error);
    }
  };

  const updateTaskHandler = async (taskId, taskData) => {
    try {
      const { data } = await api.put(
        `/tasks/${taskId}`,
        taskData,
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId ? data : task
        )
      );

    } catch (error) {
      console.log(error);
    }
  };


  const deleteTaskHandler = async (taskId) => {
    try {
      await api.delete(
        `/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      setTasks((prev) =>
        prev.filter((task) => task._id !== taskId)
      );

    } catch (error) {
      console.log(error);
    }
  };


  // FETCH TASKS
  const fetchTasks = async () => {
    try {

      const { data } = await api.get(`/tasks/${id}`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });

      setTasks(data);

    } catch (error) {
      console.log(error);
    }
  };



  const handleDragEnd = async (result) => {

    if (!result.destination) return;

    const taskId = result.draggableId;

    const newStatus = result.destination.droppableId;


    // UI UPDATE FIRST
    const updatedTasks = tasks.map((task) =>
      task._id === taskId
        ? { ...task, status: newStatus }
        : task
    );

    setTasks(updatedTasks);


    // DATABASE UPDATE
    try {

      await api.put(
        `/tasks/${taskId}`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

    } catch (error) {
      console.log(error);
    }
  };


  useEffect(() => {

    fetchTasks();

    fetchUsers();

    // JOIN ROOM
    socket.emit("joinProject", id);


    // RECEIVE NEW TASK
    socket.on("receiveTask", (task) => {
      setTasks((prev) => [task, ...prev]);
    });


    // RECEIVE UPDATED TASKS
    socket.on("tasksUpdated", (updatedTasks) => {
      setTasks(updatedTasks);
    });


    return () => {
      socket.off("receiveTask");
      socket.off("tasksUpdated");
    };

  }, []);


  // FILTER TASKS
  const todoTasks = tasks.filter(
    (task) => task.status === "todo"
  );

  const progressTasks = tasks.filter(
    (task) => task.status === "progress"
  );

  const doneTasks = tasks.filter(
    (task) => task.status === "done"
  );


  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">



        <div>

          <p className="text-blue-400 text-sm mb-4 font-mono">
            Project ID : <span className="text-red-400 ">{id}</span>
          </p>

          <h1 className="text-5xl font-black mb-4">
            {project.title}
          </h1>

          <p className="text-slate-400 text-lg">
            {project.description}
          </p>


        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 transition-all px-7 py-4 rounded-2xl font-semibold shadow-lg shadow-blue-500/20"
        >
          + Add Task
        </button>

      </div>


      {/* BOARD */}
      <DragDropContext onDragEnd={handleDragEnd}>

        <div className="relative mb-8 overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900/60 backdrop-blur-2xl p-5">

          {/* TOP GLOW */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/10 blur-[120px] rounded-full"></div>

          <div className="absolute bottom-0 right-0 w-72 h-72 bg-violet-500/10 blur-[120px] rounded-full"></div>

          <div className="relative z-10">

            {/* TAG */}
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-5 py-2 rounded-full text-sm font-medium mb-3">

              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>

              Workspace Boards

            </div>



            {/* DESCRIPTION */}
            <p className="text-slate-400 text-sm leading-relaxed ">

              Your to-do list may be long, but it can be manageable.
              Track everything from
              <span className="text-white font-semibold">
                {" "}tasks to tackle{" "}
              </span>
              to
              <span className="ml-1 mr-1 text-green-400 font-semibold">
                mission accomplished
              </span>
              with real-time collaboration and intelligent workflow management.

            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* TODO COLUMN */}
          <Droppable droppableId="todo">

            {(provided) => (

              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-[30px] p-6 min-h-[500px] z-50"
              >

                {/* HEADER */}
                <div className="flex items-center justify-between mb-8">

                  <h2 className="text-2xl font-bold">
                    Todo
                  </h2>

                  <span className="bg-slate-800 px-4 py-2 rounded-full text-sm">
                    {todoTasks.length}
                  </span>

                </div>

                {/* TASKS */}
                <div className="space-y-5">

                  {todoTasks.map((task, index) => (

                    <Draggable
                      key={task._id}
                      draggableId={task._id}
                      index={index}
                    >

                      {(provided) => (

                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="group relative overflow-hidden bg-slate-950/80 border border-slate-800 rounded-[24px] p-5 hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1"
                        >

                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-violet-500/0 group-hover:from-blue-500/10 group-hover:to-violet-500/10 transition-all"></div>

                          <div className="relative z-10">

                            <div className="flex items-start justify-between mb-5">

                              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
                                📋
                              </div>

                              <span className="bg-slate-800 px-3 py-1 rounded-full text-xs text-slate-400">
                                Todo
                              </span>

                            </div>

                            <h3 className="text-2xl font-bold mb-3">
                              {task.title}
                            </h3>

                            <p className="text-slate-400 leading-relaxed mb-6">
                              {task.description}
                            </p>

                            {/* FOOTER */}
                            <div className="flex items-center justify-between pt-5 border-t border-slate-800">

                              {/* ASSIGNED USER */}
                              {task.assignedTo ? (

                                <div className="flex items-center gap-3">

                                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                                    {task.assignedTo.name.charAt(0)}
                                  </div>

                                  <div>

                                    <p className="text-sm font-medium">
                                      {task.assignedTo.name}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                      Assigned
                                    </p>

                                  </div>

                                </div>

                              ) : (

                                <div className="text-slate-500 text-sm">
                                  Unassigned Yet
                                </div>

                              )}

                              <div className="flex items-center gap-2">

                                <button
                                  onClick={() =>
                                    updateTaskHandler(task._id, {
                                      title: prompt("Enter new title", task.title),
                                      description: prompt(
                                        "Enter new description",
                                        task.description
                                      ),
                                    })
                                  }
                                  className="bg-blue-600 hover:bg-blue-700 transition-all px-4 py-2 rounded-4xl text-sm font-medium"
                                >
                                  <Pencil size={17} />

                                </button>

                                <button
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this task?")) {
                                      deleteTaskHandler(task._id);
                                    }
                                  }}
                                  className="bg-red-600 hover:bg-red-700 transition-all px-4 py-2 rounded-4xl text-sm font-medium"
                                >
                                  <Trash2 size={17} />
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setIsTaskModalOpen(true);
                                  }}
                                  className="bg-slate-800 hover:bg-blue-600 transition-all px-4 py-2 rounded-4xl text-sm font-medium"
                                >
                                  <Eye size={17} />
                                </button>

                              </div>

                            </div>

                          </div>

                        </div>

                      )}

                    </Draggable>



                  ))}



                  {provided.placeholder}

                </div>

              </div>

            )}

          </Droppable>


          {/* PROGRESS COLUMN */}
          <Droppable droppableId="progress">

            {(provided) => (

              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-slate-900/60 backdrop-blur-xl border border-yellow-500/10 rounded-[30px] p-6 min-h-[500px] z-50"
              >

                {/* HEADER */}
                <div className="flex items-center justify-between mb-8">

                  <h2 className="text-2xl font-bold text-yellow-400">
                    In Progress
                  </h2>

                  <span className="bg-slate-800 px-4 py-2 rounded-full text-sm">
                    {progressTasks.length}
                  </span>

                </div>

                {/* TASKS */}
                <div className="space-y-5">

                  {progressTasks.map((task, index) => (

                    <Draggable
                      key={task._id}
                      draggableId={task._id}
                      index={index}
                    >

                      {(provided) => (

                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="group relative overflow-hidden bg-slate-950/80 border border-yellow-500/20 rounded-[24px] p-5 hover:border-yellow-500/40 transition-all duration-300 hover:-translate-y-1"
                        >

                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-orange-500/0 group-hover:from-yellow-500/10 group-hover:to-orange-500/10 transition-all"></div>

                          <div className="relative z-10">

                            <div className="flex items-start justify-between mb-5">

                              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl">
                                ⚡
                              </div>

                              <span className="bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full text-xs">
                                Progress
                              </span>

                            </div>

                            <h3 className="text-2xl font-bold mb-3">
                              {task.title}
                            </h3>

                            <p className="text-slate-400 leading-relaxed mb-6">
                              {task.description}
                            </p>

                            {/* FOOTER */}
                            <div className="flex items-center justify-between pt-5 border-t border-slate-800">

                              {/* ASSIGNED USER */}
                              {task.assignedTo ? (

                                <div className="flex items-center gap-3">

                                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                                    {task.assignedTo.name.charAt(0)}
                                  </div>

                                  <div>

                                    <p className="text-sm font-medium">
                                      {task.assignedTo.name}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                      Assigned
                                    </p>

                                  </div>

                                </div>

                              ) : (

                                <div className="text-slate-500 text-sm">
                                  Unassigned Yet
                                </div>

                              )}

                              <div className="flex items-center gap-2">

                                <button
                                  onClick={() =>
                                    updateTaskHandler(task._id, {
                                      title: prompt("Enter new title", task.title),
                                      description: prompt(
                                        "Enter new description",
                                        task.description
                                      ),
                                    })
                                  }
                                  className="bg-blue-600 hover:bg-blue-700 transition-all px-4 py-2 rounded-4xl text-sm font-medium"
                                >
                                  <Pencil size={17} />

                                </button>

                                <button
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this task?")) {
                                      deleteTaskHandler(task._id);
                                    }
                                  }}
                                  className="bg-red-600 hover:bg-red-700 transition-all px-4 py-2 rounded-4xl text-sm font-medium"
                                >
                                  <Trash2 size={17} />
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setIsTaskModalOpen(true);
                                  }}
                                  className="bg-slate-800 hover:bg-blue-600 transition-all px-4 py-2 rounded-4xl text-sm font-medium"
                                >
                                  <Eye size={17} />
                                </button>

                              </div>

                            </div>

                          </div>

                        </div>



                      )}

                    </Draggable>



                  ))}

                  {provided.placeholder}

                </div>

              </div>

            )}

          </Droppable>


          {/* DONE COLUMN */}
          <Droppable droppableId="done">

            {(provided) => (

              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-slate-900/60 backdrop-blur-xl border border-green-500/10 rounded-[30px] p-6 min-h-[500px] z-50"
              >

                {/* HEADER */}
                <div className="flex items-center justify-between mb-8">

                  <h2 className="text-2xl font-bold text-green-400">
                    Done
                  </h2>

                  <span className="bg-slate-800 px-4 py-2 rounded-full text-sm">
                    {doneTasks.length}
                  </span>

                </div>

                {/* TASKS */}
                <div className="space-y-5">

                  {doneTasks.map((task, index) => (

                    <Draggable
                      key={task._id}
                      draggableId={task._id}
                      index={index}
                    >

                      {(provided) => (

                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="group relative overflow-hidden bg-slate-950/80 border border-green-500/20 rounded-[24px] p-5 hover:border-green-500/40 transition-all duration-300 hover:-translate-y-1"
                        >

                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all"></div>

                          <div className="relative z-10">

                            <div className="flex items-start justify-between mb-5">

                              <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-xl">
                                ✅
                              </div>

                              <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs">
                                Done
                              </span>

                            </div>

                            <h3 className="text-2xl font-bold mb-3">
                              {task.title}
                            </h3>

                            <p className="text-slate-400 leading-relaxed mb-6">
                              {task.description}
                            </p>

                            {/* FOOTER */}
                            <div className="flex items-center justify-between pt-5 border-t border-slate-800">

                              {/* ASSIGNED USER */}
                              {task.assignedTo ? (

                                <div className="flex items-center gap-3">

                                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                                    {task.assignedTo.name.charAt(0)}
                                  </div>

                                  <div>

                                    <p className="text-sm font-medium">
                                      {task.assignedTo.name}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                      Assigned
                                    </p>

                                  </div>

                                </div>

                              ) : (

                                <div className="text-slate-500 text-sm">
                                  Unassigned Yet
                                </div>

                              )}

                              <div className="flex items-center gap-2">

                                <button
                                  onClick={() =>
                                    updateTaskHandler(task._id, {
                                      title: prompt("Enter new title", task.title),
                                      description: prompt(
                                        "Enter new description",
                                        task.description
                                      ),
                                    })
                                  }
                                  className="bg-blue-600 hover:bg-blue-700 transition-all px-4 py-2 rounded-4xl text-sm font-medium"
                                >
                                  <Pencil size={17} />

                                </button>

                                <button
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this task?")) {
                                      deleteTaskHandler(task._id);
                                    }
                                  }}
                                  className="bg-red-600 hover:bg-red-700 transition-all px-4 py-2 rounded-4xl text-sm font-medium"
                                >
                                  <Trash2 size={17} />
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setIsTaskModalOpen(true);
                                  }}
                                  className="bg-slate-800 hover:bg-blue-600 transition-all px-4 py-2 rounded-4xl text-sm font-medium"
                                >
                                  <Eye size={17} />
                                </button>

                              </div>

                            </div>

                          </div>

                        </div>

                      )}

                    </Draggable>

                  ))}

                  {provided.placeholder}

                </div>

              </div>

            )}

          </Droppable>

        </div>

      </DragDropContext>



      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={createTaskHandler}
      />

      <TaskDetailsModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onComment={addCommentHandler}
        users={users}
        onAssign={assignTaskHandler}
      />

    </div>
  );
};

export default ProjectDetails;
