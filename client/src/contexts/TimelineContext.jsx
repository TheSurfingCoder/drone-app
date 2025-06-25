import React, { createContext, useContext, useReducer } from 'react'

// Timeline element types
export const TIMELINE_ELEMENT_TYPES = {
  WAYPOINT_MISSION: 'waypoint-mission',
  HEADING: 'heading',
  RECORD_VIDEO: 'record-video',
  SHOOT_PHOTO: 'shoot-photo',
}

// Action types for the reducer
const TIMELINE_ACTIONS = {
  ADD_ELEMENT: 'ADD_ELEMENT',
  REMOVE_ELEMENT: 'REMOVE_ELEMENT',
  UPDATE_ELEMENT: 'UPDATE_ELEMENT',
  REORDER_ELEMENTS: 'REORDER_ELEMENTS',
  SET_ELEMENTS: 'SET_ELEMENTS',
}

// Initial state
const initialState = {
  elements: [],
  hasWaypointMission: false,
}

// Reducer function
function timelineReducer(state, action) {
  switch (action.type) {
    case TIMELINE_ACTIONS.ADD_ELEMENT: {
      const newElement = {
        ...action.payload,
        id: action.payload.id || Date.now().toString(),
        order: state.elements.length,
      }

      const updatedElements = [...state.elements, newElement]
      const hasWaypointMission = updatedElements.some(
        (el) => el.type === TIMELINE_ELEMENT_TYPES.WAYPOINT_MISSION,
      )

      return {
        ...state,
        elements: updatedElements,
        hasWaypointMission,
      }
    }

    case TIMELINE_ACTIONS.REMOVE_ELEMENT: {
      const filteredElements = state.elements.filter((el) => el.id !== action.payload)
      const hasWaypointMissionAfterRemove = filteredElements.some(
        (el) => el.type === TIMELINE_ELEMENT_TYPES.WAYPOINT_MISSION,
      )

      return {
        ...state,
        elements: filteredElements,
        hasWaypointMission: hasWaypointMissionAfterRemove,
      }
    }

    case TIMELINE_ACTIONS.UPDATE_ELEMENT: {
      const updatedElementsAfterEdit = state.elements.map((el) =>
        el.id === action.payload.id ? { ...el, ...action.payload } : el,
      )
      const hasWaypointMissionAfterEdit = updatedElementsAfterEdit.some(
        (el) => el.type === TIMELINE_ELEMENT_TYPES.WAYPOINT_MISSION,
      )

      return {
        ...state,
        elements: updatedElementsAfterEdit,
        hasWaypointMission: hasWaypointMissionAfterEdit,
      }
    }

    case TIMELINE_ACTIONS.REORDER_ELEMENTS: {
      const reorderedElements = action.payload.map((element, index) => ({
        ...element,
        order: index,
      }))

      return {
        ...state,
        elements: reorderedElements,
      }
    }

    case TIMELINE_ACTIONS.SET_ELEMENTS: {
      const hasWaypointMissionAfterSet = action.payload.some(
        (el) => el.type === TIMELINE_ELEMENT_TYPES.WAYPOINT_MISSION,
      )

      return {
        ...state,
        elements: action.payload,
        hasWaypointMission: hasWaypointMissionAfterSet,
      }
    }

    default:
      return state
  }
}

// Create context
const TimelineContext = createContext()

// Provider component
export function TimelineProvider({ children }) {
  const [state, dispatch] = useReducer(timelineReducer, initialState)

  // Actions
  const addElement = (element) => {
    // Check if trying to add waypoint mission when one already exists
    if (element.type === TIMELINE_ELEMENT_TYPES.WAYPOINT_MISSION && state.hasWaypointMission) {
      throw new Error('Only one waypoint mission is allowed per timeline')
    }

    dispatch({
      type: TIMELINE_ACTIONS.ADD_ELEMENT,
      payload: element,
    })
  }

  const removeElement = (elementId) => {
    dispatch({
      type: TIMELINE_ACTIONS.REMOVE_ELEMENT,
      payload: elementId,
    })
  }

  const updateElement = (elementId, updates) => {
    dispatch({
      type: TIMELINE_ACTIONS.UPDATE_ELEMENT,
      payload: { id: elementId, ...updates },
    })
  }

  const reorderElements = (newOrder) => {
    dispatch({
      type: TIMELINE_ACTIONS.REORDER_ELEMENTS,
      payload: newOrder,
    })
  }

  const setElements = (elements) => {
    dispatch({
      type: TIMELINE_ACTIONS.SET_ELEMENTS,
      payload: elements,
    })
  }

  // Helper functions
  const canAddWaypointMission = () => !state.hasWaypointMission

  const getElementById = (id) => {
    return state.elements.find((el) => el.id === id)
  }

  const getElementsByType = (type) => {
    return state.elements.filter((el) => el.type === type)
  }

  const getWaypointMission = () => {
    return state.elements.find((el) => el.type === TIMELINE_ELEMENT_TYPES.WAYPOINT_MISSION)
  }

  const value = {
    // State
    elements: state.elements,
    hasWaypointMission: state.hasWaypointMission,

    // Actions
    addElement,
    removeElement,
    updateElement,
    reorderElements,
    setElements,

    // Helper functions
    canAddWaypointMission,
    getElementById,
    getElementsByType,
    getWaypointMission,
  }

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>
}

// Custom hook to use the timeline context
export function useTimeline() {
  const context = useContext(TimelineContext)
  if (!context) {
    throw new Error('useTimeline must be used within a TimelineProvider')
  }
  return context
}
