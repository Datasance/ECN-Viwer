import React, { ReactNode, useReducer, useContext, createContext } from "react";
import { findIndex } from "lodash";
import Alert from "./Alert";

type FeedbackType = "success" | "error" | "warning" | "info";

interface Feedback {
  id: number;
  message: string;
  type: FeedbackType;
  timeout: number;
  [key: string]: any;
}

interface FeedbackContextType {
  feedbacks: Feedback[];
  setFeedbacks: (feedbacks: Feedback[]) => void;
  pushFeedback: (feedback: Omit<Feedback, "id" | "timeout">) => void;
}

export const FeedbackContext = createContext<FeedbackContextType>({
  feedbacks: [],
  setFeedbacks: () => {},
  pushFeedback: () => {},
});

export const useFeedback = () => useContext(FeedbackContext);

const AUTO_HIDE = 6000;

const actions = {
  ADD: "add",
  REMOVE: "remove",
  SET: "set",
} as const;

type Action =
  | {
      type: typeof actions.ADD;
      data: Omit<Feedback, "id" | "timeout">;
      dispatch: React.Dispatch<Action>;
    }
  | { type: typeof actions.REMOVE; data: { id: number } }
  | { type: typeof actions.SET; data: Feedback[] };

interface State {
  feedbacks: Feedback[];
  nextId: number;
}

const initState: State = {
  feedbacks: [],
  nextId: 0,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actions.ADD: {
      const { message, type, ...rest } = action.data;

      const newFeedback: Feedback = {
        id: state.nextId,
        message,
        type,
        timeout: window.setTimeout(() => {
          action.dispatch({ type: actions.REMOVE, data: { id: state.nextId } });
        }, AUTO_HIDE),
        ...rest,
      };

      return {
        feedbacks: [...state.feedbacks, newFeedback],
        nextId: state.nextId + 1,
      };
    }
    case actions.REMOVE: {
      const idxToRemove = findIndex(
        state.feedbacks,
        (f) => f.id === action.data.id,
      );
      if (idxToRemove === -1) return state;
      clearTimeout(state.feedbacks[idxToRemove].timeout);

      return {
        ...state,
        feedbacks: [
          ...state.feedbacks.slice(0, idxToRemove),
          ...state.feedbacks.slice(idxToRemove + 1),
        ],
      };
    }
    case actions.SET:
      return {
        ...state,
        feedbacks: action.data,
      };
    default:
      return state;
  }
};

interface FeedbackProviderProps {
  children: ReactNode;
}

export default function FeedbackProvider({ children }: FeedbackProviderProps) {
  const [state, dispatch] = useReducer(reducer, initState);

  const setFeedbacks = (newFeedbacks: Feedback[]) => {
    dispatch({ type: actions.SET, data: newFeedbacks });
  };

  const pushFeedback = (newFeedback: Omit<Feedback, "id" | "timeout">) => {
    dispatch({ type: actions.ADD, data: newFeedback, dispatch });
  };

  return (
    <FeedbackContext.Provider
      value={{ feedbacks: state.feedbacks, setFeedbacks, pushFeedback }}
    >
      {children}
      <Alert
        open={state.feedbacks.length > 0}
        alerts={state.feedbacks.map((f) => ({
          ...f,
          onClose: () => dispatch({ type: actions.REMOVE, data: { id: f.id } }),
        }))}
      />
    </FeedbackContext.Provider>
  );
}
