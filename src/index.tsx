import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Redux from "redux"
import { createStore, applyMiddleware, compose } from "redux"
import { Provider, connect } from "react-redux"
import { AppContainer } from "react-hot-loader"
import dispatch from "./dispatchMiddleware"
import * as Router from "./router"
import { RouteToUri, UriToRoute } from "./router"

export { React }

export type Dispatch = <A extends Redux.Action, E>(action: A, e?: React.SyntheticEvent<E>) => A

export type Dispatcher = {dispatch: Dispatch}

export class DispatchComponent<P> extends React.PureComponent<P & Dispatcher> {
  constructor(props: P & Dispatcher) {
    super(props)
    this.dispatch = this.dispatch.bind(this)
  }

  dispatch<A extends Redux.Action, E>(
           action: A,
           eventToStop?: React.SyntheticEvent<E>) {
    if (eventToStop) eventToStop.stopPropagation()
    return this.props.dispatch(action)
  }
}

export type Goto<Route> = Router.Action<Route>
export type GotoType = Router.ActionType
export const GotoType = Router.ActionType.Goto
export const goto = Router.goto

type Update<State, Action> = (state: State, action: Action) => State

export const load = function<State extends {},
                      Action extends Redux.Action,
                      Route>(
    RootJSXElement: (state: State) => JSX.Element,
    update: Update<State, Action>,
    routeToUri: RouteToUri<Route>,
    uriToRoute: UriToRoute<Route>,
    rootHTMLElement?: HTMLElement) {

  const wrappedUpdate = (state: State, action: Action) => {
    Router.update(action as any as Router.Action<Route>, routeToUri)
    return update(state, action)
  }

  // Initalize the store

  const composeEnhancers = (window as any).
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

  let store = createStore(
    wrappedUpdate,
    composeEnhancers(applyMiddleware(dispatch))
  )

  class Index extends DispatchComponent<any> {
    unloadRouter: () => void

    componentWillMount() {
      this.unloadRouter = Router.load(
        this.props.dispatch,
        uriToRoute
      )
    }

    componentWillUnmount() {
      this.unloadRouter()
    }

    render() {
      return <RootJSXElement {...this.props as State}/>
    }
  }

  const View = connect((s: any) => s)(Index)

  ReactDOM.render(
    <AppContainer>
      <Provider store={store}>
        <View />
      </Provider>
    </AppContainer>,
    rootHTMLElement || document.body.firstChild as HTMLElement
  )

  return (update: Update<State, Action>) => { store.replaceReducer(update) }
}