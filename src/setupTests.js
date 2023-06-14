import { configure } from 'enzyme'
import 'jest-enzyme'
import Adapter from 'enzyme-adapter-react-16'
// react-testing-library renders your components to document.body,
// this adds jest-dom's custom assertions
import '@testing-library/jest-dom/extend-expect'

configure({ adapter: new Adapter() })
