import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import popupTools from 'popup-tools';
import { withRouter } from 'react-router';
import { fetchUser } from '../actions';
import axios from 'axios';

class Header extends Component {
  // constructor() {
  //   super();
  //   this.handleClick = this.handleClick.bind(this);
  // }

  renderContent() {
    switch (this.props.auth) {
      case null:
        return;
      case false:
        return (
          <li>
            <a onClick={() => this.handleLogin()}>Login With Google</a>
          </li>
        );
      default:
        return [
          <li key="1">
            <a onClick={() => this.handleLogout()}>Logout</a>
          </li>
        ];
    }
  }

  handleLogin() {
    popupTools.popup('/auth/google', 'Google Login', {}, (err, user) => {
      if (!err) {
        this.props.history.push('/surveys');
        this.props.fetchUser();
      }
    });
    axios.post('/wwe/login');
  }

  async handleLogout() {
    await axios.post('/wwe/logout');
    await axios.get('/api/logout');
    this.props.history.push('/');
    this.props.fetchUser();
  }

  render() {
    return (
      <nav>
        <div className="nav-wrapper">
          <Link to={this.props.auth ? '/surveys' : '/'} className="left brand-logo">
            Emotive
          </Link>
          <ul className="right">{this.renderContent()}</ul>
        </div>
      </nav>
    );
  }
}

function mapStateToProps({ auth }) {
  return { auth };
}

export default withRouter(connect(mapStateToProps, { fetchUser })(Header));
