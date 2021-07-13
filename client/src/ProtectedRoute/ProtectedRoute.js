import React from 'react'
import {Redirect, Route} from 'react-router-dom'
import {connect} from 'react-redux';

class ProtectedRoute extends React.Component {
    render() {
        
        const {component: Component, ...props} = this.props;
        // If authorized then move ahead or redirect
        return (
            <Route {...props} render={props => (this.props.auth ? <Component {...props} /> : <Redirect to='/signin' />)} />
        )
    }
}

const mapStateToProps = state => {
    return {
        auth: state.userDetails.auth
    }
}

export default connect(mapStateToProps, undefined)(ProtectedRoute);