function descendingOrder(a, b){
  return b.id - a.id;
}

const baseTask = {
  id: null,
  taskTitle: '',
  taskDescription: '',
  taskOwnerName: '',
  taskEstimatedTimeHours: 0,
  taskRewardDKK: 0,
  taskCategory: '',
  taskDeadline: null,
  taskPictures: [],
  taskCoords: {
    lat: null,
    lon: null,
  },

  didBid: false,
}

class Model {
  constructor() {
    const localTasks = JSON.parse(localStorage.getItem('tasks')) || []
    
    this.tasks = localTasks.sort(descendingOrder);
  }

  bindTodoListChanged(callback) {
    this.onTodoListChanged = callback
  }

  _commit(tasks) {
    this.onTodoListChanged(tasks)
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }

  _makeId() {
    if (this.tasks.length > 0) {
      return (this.tasks.length - 1) + 1
    } else {
      return 0;
    }
  }

  addTodo(taskObject) {
    const newTask = {
      ...baseTask,
      id: this._makeId(),
      ...taskObject,
    }

    this.tasks.push(newTask)

    this.tasks.sort(descendingOrder);

    this._commit(this.tasks)
  }

  editTodo(id, updatedText) {
    this.tasks = this.tasks.map(todo =>
      todo.id === id ? { id: todo.id, text: updatedText, complete: todo.complete } : todo
    )

    this._commit(this.tasks)
  }

  deleteTodo(id) {
    this.todos = this.todos.filter(todo => todo.id !== id)

    this._commit(this.todos)
  }

  toggleTodo(id) {
    this.todos = this.todos.map(todo =>
      todo.id === id ? { id: todo.id, text: todo.text, complete: !todo.complete } : todo
    )

    this._commit(this.todos)
  }
}

class View {
  constructor() {
    this.app = this.getElement('#root')
    this.form = this.getElement('#taskForm')
    this.formCat = this.getElement('#taskCategory')
    this.formUsePosBtn = this.getElement('#usePositionBtn')
    this.formPos = this.getElement('#pos')
    this.taskList = this.getElement('#taskList')

    this.latestPosition = null
  }

  get _form() {
    const inputs = document.forms["taskForm"].getElementsByTagName("input");
    const inputsArr = [ ...inputs ]

    const formObject = {}
    const categorySelection = this.formCat.options[this.formCat.selectedIndex].value;

    inputsArr.forEach(input => {
      // Spring feltet over
      if(input.id === 'pos') return
      
      formObject[input.id] = input.value
    })

    const usePosition = !!this.latestPosition

    if(usePosition) {
      const { lat, lon } = this.latestPosition
    }

    const coords = usePosition ? { lat, lon } : null
  
    return {
      ...formObject,
      taskCategory: categorySelection,
      taskCoords: coords,
    }
  }

  _resetInput() {
    const inputs = document.forms["taskForm"].getElementsByTagName("input");
    const inputsArr = [ ...inputs ]

    inputsArr.forEach(input => {
      input.value = ''
    })

    this.formCat.selectedIndex = 0

    this.latestPosition = null
  }

  createElement(tag, className) {
    const element = document.createElement(tag)

    if (className) element.classList.add(className)

    return element
  }

  getElement(selector) {
    const element = document.querySelector(selector)

    return element
  }

  displayTodos(tasks) {
    // Reset liste
    while (this.taskList.firstChild) {
      this.taskList.removeChild(this.taskList.firstChild)
    }

    // Hvis opgaver er tom, vis en besked
    if (tasks.length === 0) {
      const p = this.createElement('p')
      p.textContent = 'Ingen opgaver...'
      this.taskList.append(p)
    } else {
      tasks.forEach(todo => {
        // opret parent li element
        const li = this.createElement('li')
        li.id = todo.id

        const debugElement = this.createElement('pre')
        debugElement.textContent = JSON.stringify(todo, undefined, 2);

        // Tilføj span til li
        li.append(
          debugElement,
        )

        // Tilføj li til listen
        this.taskList.append(li)
      })
    }
  }

  bindAddTodo(addTaskHandler) {
    this.form.addEventListener('submit', event => {
      event.preventDefault()

      if (this._form.taskTitle) {
        addTaskHandler(this._form)

        this._resetInput()
      }
    })
  }

  bindUsePosition() {
    const _onGeoSuccess = ({ coords }) => {
      const { latitude, longitude } = coords
      this.formPos.value = `${Math.round(latitude)}, ${Math.round(longitude)}`

      this.latestPosition = {
        lat: latitude,
        lon: longitude,
      }
    }

    this.formUsePosBtn.addEventListener("click", event => {
      event.preventDefault()

      if(!navigator.geolocation) {
        console.log('Geolocation is not supported by your browser')
      } else {
        this.formPos.value = "Søger..."

        navigator.geolocation.getCurrentPosition(
          _onGeoSuccess, 
          () => {},
        );
      }

    })
  }
}

/**
 * @class Controller
 *
 * Links the user input and the view output.
 *
 * @param model
 * @param view
 */
class Controller {
  constructor(model, view) {
    this.model = model
    this.view = view

    // Explicit this binding
    this.model.bindTodoListChanged(this.onTodoListChanged)
    this.view.bindAddTodo(this.handleAddTodo)
    this.view.bindUsePosition()

    // Display initial tasks
    this.onTodoListChanged(this.model.tasks)
  }

  onTodoListChanged = tasks => {
    this.view.displayTodos(tasks)
  }

  handleAddTodo = taskObject => {
    this.model.addTodo(taskObject)
  }

}

document.addEventListener("DOMContentLoaded", () => {
  const app = new Controller(
    new Model(), 
    new View()
  )
});
