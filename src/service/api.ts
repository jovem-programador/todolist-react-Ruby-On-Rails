import axios from "axios";
import { TaskType } from "../components/task_manager";

const url = 'http://localhost:3000/api/tasks'

// GET
export const listTasksApi = () => axios.get<TaskType[]>(url)

// POST
export const createTaskApi = async (newTask: TaskType) => {
    try {
        const response = await axios.post(url, newTask);
        return response.data;
    } catch (error) {
        console.log('Error na requisição', error);
        throw error;
    }
}

// UPDATE
export const updateTaskApi = async (taskId: number, updatedTask: Partial<TaskType>) => {
    try {
        const response = await axios.patch(`${url}/${taskId}`, updatedTask);
        if (response.status === 200) {
            console.log('Tarefa atualizada com sucesso!');
        }
    } catch (error) {
        console.error('Erro na requisição PATCH:', error);
        throw error;
    }
}

// DELETE
export const deleteTaskApi = async (taskId: number) => {
    try {
        const response = await axios.delete(`${url}/${taskId}`);
        if (response.status === 200) {
            console.log('Tarefa atualizada com sucesso!');
        }
    } catch (error) {
        console.error('Erro na requisição DELETE:', error);
        throw error;
    }
}