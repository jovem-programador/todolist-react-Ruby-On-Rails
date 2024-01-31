import { FC, useEffect, useRef, useState } from "react"
import classNames from "classnames"
import { createTaskApi, deleteTaskApi, listTasksApi, updateTaskApi } from "../service/api"

// Objeto (MODEL)
export type TaskType = {
  id: number,
  title: string,
  done: boolean
}

// Objeto Pai da aplicação
const TaskManager: FC = () => {

  // Tarefas (Tasks) ESTADO
  const [tasks, setTasks] = useState<TaskType[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [taskBeingEditedId, setTaskBeingEditedId] = useState<TaskType['id'] | null>(null)

  // Referencia do Titulo atraves do Id
  const taskTitlesRef = useRef<{ [index: TaskType['id']]: HTMLInputElement }>({})

  // Metodo GET()
  useEffect(() => {
    listTasksApi().then(response => {
      setTasks(response.data)
    })
  }, [])

  // Método POST()
  const handleCreateTask = () => {
    if (newTaskTitle.trim() !== '') {
      const newTaskData = {
        id: +1,
        title: newTaskTitle,
        done: false,
      };

      createTaskApi(newTaskData)
        .then(response => {
          setTasks(previousTasks => [...previousTasks, response]);
          setNewTaskTitle('');
        })
        .catch(error => {
          // Lidar com o erro, se necessário
          console.error('Erro ao criar tarefa:', error);
        });
    }
  }

  const handleNewTaskTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key
    const title = newTaskTitle.trim()
    if (key === 'Enter' && title !== "") {
      setTasks(previousTasks => previousTasks.concat({ id: previousTasks.length + 1, title: title, done: false }))
      handleCreateTask()
      setNewTaskTitle('')
    }
  }

  // Metodo UPDATE()
  const handleTaskTitleKeyDown = (editedTask: TaskType) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = taskTitlesRef.current[editedTask.id]
    const { key } = e
    const title = input.value.trim()

    if (key === 'Enter') {
      if (title !== "" && title !== editedTask.title) {
        // Chamada para atualizar a tarefa
        updateTaskApi(editedTask.id, { title })
          .then(() => {
            // Atualize o estado local para refletir a atualização da tarefa
            setTasks(previousTasks => previousTasks.map(task => (task.id === editedTask.id ? { ...task, title } : task)));
            // Limpe o ID da tarefa sendo editada
            setTaskBeingEditedId(null);
          })
          .catch(error => {
            // Lidar com erros, se necessário
            console.error('Erro ao atualizar tarefa:', error);
          });
      }
    } else if (key === 'Escape') {
      input.value = editedTask.title;
      // Limpe o ID da tarefa sendo editada
      setTaskBeingEditedId(null);
    }
  };

  // Metodo DELETE()
  const handleTaskDeleteClick = (deleteTask: TaskType) => (_e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    deleteTaskApi(deleteTask.id)
      .then(() => {
        // Pegando todas as Tarefas que são diferentes das que estão sendo excluidas
        setTasks(previousTasks => previousTasks.filter(task => task !== deleteTask))
      }).catch(error => {
        console.error('Erro ao excluir tarefa:', error);
      })
  }

  // Delete All
  const handleClearAllTasks = () => {
    // Obtém as IDs de todas as tarefas
    const taskIds = tasks.map(task => task.id);

    // Para cada ID, chama deleteTaskApi para excluir a tarefa
    Promise.all(taskIds.map(id => deleteTaskApi(id)))
      .then(() => {
        // Limpa todas as tarefas após a exclusão bem-sucedida
        setTasks([]);
      })
      .catch(error => {
        console.error('Erro ao excluir tarefas:', error);
        // Lida com erros, se necessário
      });
  };

  // Filtrando tarefas (Todos, Ativos, Completos)
  type FilterType = 'all' | 'active' | 'completed'

  /*
    Estado das Tarefas
    Filtando Tarefas atraves dos filtros
  */
  const [filter, setFilter] = useState<FilterType>('all')
  const activeTalsks = tasks.filter(task => !task.done)
  const completdTasks = tasks.filter(task => task.done)

  // Aplicando o filtro de acordo com o CLICK()
  const applyFilterSelectedClass = (filterValue: FilterType) => classNames({ selected: filter === filterValue })

  // Estrutura de controle
  const visibleTasks = () => {
    switch (filter) {
      case 'all': return tasks
      case 'active': return activeTalsks
      case 'completed': return completdTasks
      default: {
        // Exhaustiveness checking
        const _exhaustiveCheck: never = filter;
        return _exhaustiveCheck;
      }
    }
  }

  // Botão de Status da tarefa
  const handleTaskUpdateStatusChange = (updateTask: TaskType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const done = e.target.checked

    setTasks(previousTasks => previousTasks.map(task => (task === updateTask ? { ...task, done } : task)))
  }

  // Estado da Tarefa
  const [allTasksChecked, setAllTasksChecked] = useState(false);

  // Metodo Tarefa Check All
  const handleToggleAllTasks = () => {
    const newAllTasksChecked = !allTasksChecked;

    // Atualiza o estado para refletir o novo valor do checkbox global
    setAllTasksChecked(newAllTasksChecked);

    // Atualiza o estado das tarefas para marcar ou desmarcar todas
    setTasks(previousTasks => previousTasks.map(task => ({ ...task, done: newAllTasksChecked })));
  };

  // Colocando foco no caixa de texto do titulo da Tarefa
  const handleTaskTitleLabelDoubleClick = (task: TaskType) => (_e: React.MouseEvent<HTMLLabelElement, MouseEvent>) => {

    const input = taskTitlesRef.current[task.id]
    setTaskBeingEditedId(task.id)
    input.value = task.title
    setTimeout(() => input.focus(), 0)

  }

  return (
    <>
      <section className='todoapp'>
        <header className='header'>
          <h1>todos</h1>
          <input className='new-todo' placeholder='What needs to be done?' autoFocus
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            onKeyDown={handleNewTaskTitleKeyDown}
          />
        </header>

        <section className='main'>
          <input id='toggle-all' className='toggle-all' type='checkbox' checked={allTasksChecked} onChange={handleToggleAllTasks} />
          <label htmlFor='toggle-all'>Mark all as complete</label>
          <ul className='todo-list'>

            {visibleTasks().map(task =>

              <li className={classNames({ completed: task.done, editing: task.id === taskBeingEditedId })} key={task.id}>
                <div className='view'>
                  <input className='toggle' type='checkbox' checked={task.done}
                    onChange={handleTaskUpdateStatusChange(task)} />
                  <label onDoubleClick={handleTaskTitleLabelDoubleClick(task)}>{task.title}</label>
                  <button className='destroy'
                    onClick={handleTaskDeleteClick(task)}></button>
                </div>
                <input className='edit'
                  ref={el => {
                    if (el !== null) taskTitlesRef.current[task.id] = el
                  }}
                  onKeyDown={handleTaskTitleKeyDown(task)}
                />
              </li>
            )}

          </ul>
        </section>

        <footer className='footer'>
          <span className='todo-count'>
            <strong>{activeTalsks.length}</strong> item{activeTalsks.length !== 1 && 's'} left
          </span>
          <ul className='filters'>
            <li>
              <a className={applyFilterSelectedClass('all')} href='#' onClick={() => setFilter('all')}>
                All
              </a>
            </li>
            <li>
              <a className={applyFilterSelectedClass('active')} href='#' onClick={() => setFilter('active')}>Active</a>
            </li>
            <li>
              <a className={applyFilterSelectedClass('completed')} href='#' onClick={() => setFilter('completed')}>Completed</a>
            </li>
          </ul>
          <button className='clear-completed' onClick={handleClearAllTasks}>Clear completed</button>
        </footer>
      </section>

      <footer className='info'>
        <p>Double-click to edit a todo</p>
        <p>
          Template by <a href='http://sindresorhus.com'>Sindre Sorhus</a>
        </p>
        <p>
          Created by <a href='http://todomvc.com'>you</a>
        </p>
        <p>
          Part of <a href='http://todomvc.com'>TodoMVC</a>
        </p>
      </footer>
    </>
  )
}

export default TaskManager