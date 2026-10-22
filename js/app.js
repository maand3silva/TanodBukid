(() => {
  'use strict'

  const pageTitle = document.querySelector('#page-title')
  const pageSubtitle = document.querySelector('#page-subtitle')
  const pageCard = document.querySelector('#page-card')
  const landingApp = document.querySelector('#landing-app')
  const authApp = document.querySelector('#auth-app')
  const projectBaseUrl = new URL('./', window.location.href)
  const apiBaseUrl = new URL('api/', projectBaseUrl)
  const dashboardHomePath = 'Tanod%20Bukid%20Dash%20Board%20(1)/index%20(1).html'
  const state = { route: window.location.hash.slice(1) }

  try {
    localStorage.removeItem('tanodbukid_users')
  } catch (error) {
    console.warn('Unable to remove old browser-stored account data:', error)
  }

  const pages = {
    signin: ['WELCOME', 'Sign in to your TanodBukid account'],
    register: ['CREATE YOUR ACCOUNT', 'Join TanodBukid for free'],
    verify: ['VERIFY YOUR NUMBER', ''],
    reset: ['RESET PASSWORD', 'Enter your mobile number to receive a reset link']
  }
  const passwordRules = [
    ['length', 'At least 8 characters'],
    ['uppercase', 'One uppercase letter (A–Z)'],
    ['lowercase', 'One lowercase letter (a–z)'],
    ['number', 'One number (0–9)'],
    ['special', 'One special character (!@#$%)'],
    ['spaces', 'No spaces'],
    ['maxLength', 'No more than 72 bytes']
  ]

  function field(label, id, placeholder, type = 'text', autocomplete = 'off') {
    return `<div class="field"><label for="${id}" class="label">${label}</label><input id="${id}" name="${id}" class="input" type="${type}" placeholder="${placeholder || ''}" autocomplete="${autocomplete}" required></div>`
  }

  function passwordField(id, autocomplete, label = 'Password') {
    return `<div class="field"><label for="${id}" class="label">${label}</label><div class="password-row"><input id="${id}" name="${id}" class="input" type="password" autocomplete="${autocomplete}" required><button type="button" class="password-toggle" data-toggle-password="${id}">Show</button></div></div>`
  }

  function authLayout(content) {
    landingApp.hidden = true
    authApp.hidden = false
    pageCard.innerHTML = `<p id="auth-feedback" class="auth-feedback" role="alert" hidden></p>${content}`
    bindEvents()
    window.scrollTo(0, 0)
  }

  function renderSignin() {
    pageTitle.textContent = pages.signin[0]
    pageSubtitle.textContent = pages.signin[1]
    authLayout(`<form data-auth-form="login">${field('Mobile Number', 'signin-mobile', '09XX XXX XXXX', 'tel', 'tel')}${passwordField('signin-password', 'current-password')}<div style="text-align:right;margin-bottom:12px"><a href="#reset" class="link">Forgot password?</a></div><button class="primary-btn" type="submit">SIGN IN</button></form><div class="footer">Don't have an account? <a href="#register" class="link">Register</a></div>`)
  }

  function renderRegister() {
    pageTitle.textContent = pages.register[0]
    pageSubtitle.textContent = pages.register[1]
    const checklist = passwordRules.map(([rule, label]) => `<li data-password-rule="${rule}" style="color:#777;font-size:12px;line-height:1.5"><span aria-hidden="true">×</span> ${label}</li>`).join('')
    authLayout(`<form data-auth-form="register"><div style="display:flex;gap:10px"><div style="flex:1">${field('First Name', 'reg-first', 'First name', 'text', 'given-name')}</div><div style="flex:1">${field('Last Name', 'reg-last', 'Last name', 'text', 'family-name')}</div></div>${field('Mobile Number', 'reg-mobile', '09XX XXX XXXX', 'tel', 'tel')}${field('Email address', 'reg-email', 'youremail@gmail.com', 'email', 'email')}${passwordField('reg-password', 'new-password')}<div aria-live="polite" style="margin:-8px 0 12px"><strong style="font-size:12px">Password requirements</strong><ul id="password-checklist" style="display:grid;grid-template-columns:1fr 1fr;gap:1px 10px;margin:4px 0 6px;padding:0;list-style:none">${checklist}</ul><p id="password-strength" style="margin:0;font-size:12px">Strength: Weak</p><p id="password-match" role="status" style="margin:3px 0 0;font-size:12px"></p><p id="register-status" style="margin:3px 0 0;font-size:12px">Complete all required fields and password requirements.</p></div>${passwordField('reg-confirm-password', 'new-password', 'Confirm Password')}<button class="primary-btn" type="submit">CREATE ACCOUNT</button></form><div class="footer">Already Registered? <a href="#signin" class="link">Sign In</a></div>`)
  }

  // TANODBUKID_OTP_UI_V1 - simulated SMS OTP is for local development only.
  let recoveryMobile = ''
  let recoveryToken = ''

  function renderVerify() {
    pageTitle.textContent = 'VERIFY YOUR NUMBER'
    pageSubtitle.textContent = 'Enter the six-digit development OTP'
    authLayout(`<form data-auth-form="verify-otp"><p>Number: ${recoveryMobile}</p>${field('Six-digit code', 'verify-code', '000000', 'text', 'one-time-code')}<button class="primary-btn" type="submit">VERIFY CODE</button></form><div class="info-box">Code expires after 5 minutes. Five attempts maximum.</div><div class="footer"><a class="link" href="#reset">Request another code</a></div>`)
    const otpInput = document.getElementById('verify-code')
    otpInput.setAttribute('inputmode', 'numeric')
    otpInput.setAttribute('maxlength', '6')
    otpInput.setAttribute('pattern', '[0-9]{6}')
  }

  function renderReset() {
    pageTitle.textContent = 'FORGOT PASSWORD'
    pageSubtitle.textContent = 'Reset your password using your registered mobile number'
    authLayout(`<form data-auth-form="request-otp">${field('Mobile Number', 'reset-mobile', '09XX XXX XXXX', 'tel', 'tel')}<button class="primary-btn" type="submit">SEND RESET CODE</button></form><div class="info-box">A simulated SMS OTP will be displayed during local development. No real SMS is sent.</div><div class="footer">Remember password? <a href="#signin" class="link">Sign In</a></div>`)
  }

  function renderNewPassword() {
    if (!recoveryToken) { window.location.hash='reset'; return }
    pageTitle.textContent = 'NEW PASSWORD'
    pageSubtitle.textContent = 'Create a secure new password'
    authLayout(`<form data-auth-form="reset-password">${passwordField('new-password', 'new-password', 'New Password')}${passwordField('confirm-new-password', 'new-password', 'Confirm Password')}<p class="info-box">Use 8–72 bytes, uppercase and lowercase letters, a number and special character, no spaces.</p><button class="primary-btn" type="submit">SAVE NEW PASSWORD</button></form>`)
  }

  function showFeedback(message, isError = true) {
    const feedback = pageCard.querySelector('#auth-feedback')
    feedback.hidden = !message
    feedback.dataset.kind = isError ? 'error' : 'success'
    feedback.textContent = message
  }

  function passwordState(password) {
    const categories = [
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^\p{L}\p{N}\s]/u.test(password),
    ]
    const rules = {
      length: password.length >= 8,
      uppercase: categories[0],
      lowercase: categories[1],
      number: categories[2],
      special: categories[3],
      spaces: !/\s/.test(password),
      maxLength: new TextEncoder().encode(password).length <= 72,
    }
    const valid = Object.values(rules).every(Boolean)
    const variety = categories.filter(Boolean).length
    const strength = valid
      ? password.length >= 14 ? 'Very strong' : password.length >= 10 ? 'Strong' : 'Fair'
      : password.length >= 8 && variety >= 2 ? 'Fair' : 'Weak'
    return { rules, valid, strength }
  }

  function updateRegistrationState(form) {
    if (!form || form.dataset.authForm !== 'register') return
    const password = form.querySelector('#reg-password').value
    const confirmation = form.querySelector('#reg-confirm-password').value
    const { rules, valid, strength } = passwordState(password)
    const checklist = form.querySelector('#password-checklist')
    passwordRules.forEach(([rule]) => {
      const item = checklist.querySelector(`[data-password-rule="${rule}"]`)
      const passed = rules[rule]
      item.style.color = passed ? '#20563c' : '#777'
      item.querySelector('span').textContent = passed ? '✓' : '×'
    })

    const strengthElement = form.querySelector('#password-strength')
    strengthElement.textContent = `Strength: ${strength}`
    strengthElement.style.color = strength === 'Very strong' || strength === 'Strong'
      ? '#20563c'
      : strength === 'Fair' ? '#8a6d1d' : '#8a2020'

    const matchElement = form.querySelector('#password-match')
    const passwordsMatch = confirmation.length > 0 && password === confirmation
    matchElement.textContent = confirmation.length === 0
      ? 'Confirm your password.'
      : passwordsMatch ? 'Passwords match.' : 'Passwords do not match.'
    matchElement.style.color = passwordsMatch ? '#20563c' : confirmation.length === 0 ? '#777' : '#8a2020'

    const fieldsValid = form.checkValidity()
    const button = form.querySelector('button[type="submit"]')
    // Keep the button clickable so validation feedback can be displayed.
    const status = form.querySelector('#register-status')
    if (!valid) {
      status.textContent = 'Meet all password requirements above to continue.'
    } else if (!passwordsMatch) {
      status.textContent = 'Enter the same password in both fields.'
    } else if (!fieldsValid) {
      status.textContent = 'Complete the required registration fields to continue.'
    } else {
      status.textContent = 'All requirements met.'
    }
  }

  async function requestAuth(endpoint, body) {
    let response
    try {
      response = await fetch(new URL(endpoint, apiBaseUrl), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      })
    } catch {
      throw new Error('Unable to contact the authentication server. Check that the PHP server is running.')
    }

    let result
    try {
      result = await response.json()
    } catch {
      throw new Error('The authentication server returned an invalid response.')
    }

    if (!response.ok || !result.success) {
      const validationMessages = result.errors ? Object.values(result.errors).join(' ') : ''
      throw new Error(validationMessages || result.message || 'Authentication failed.')
    }
    return result
  }

  async function submitAuthForm(event) {
    event.preventDefault()
    const form = event.currentTarget
    const button = form.querySelector('button[type="submit"]')
    if (form.dataset.authForm === 'register') {
      updateRegistrationState(form)

      const password = form.querySelector('#reg-password').value
      const confirmation = form.querySelector('#reg-confirm-password').value

      if (!form.checkValidity()) {
        form.reportValidity()
        showFeedback('Complete all required fields with valid information.')
        return
      }

      if (!passwordState(password).valid || password !== confirmation || !confirmation) {
        showFeedback('Check password requirements and confirm matching passwords.')
        return
      }
    } else if (!form.checkValidity()) {
      form.reportValidity()
      return
    }
    const originalText = button.textContent
    const values = Object.fromEntries(new FormData(form))
    button.disabled = true
    button.textContent = 'PLEASE WAIT'
    showFeedback('')

    try {
      if (form.dataset.authForm === 'register') {
        await requestAuth('register.php', {
          first_name: values['reg-first'],
          last_name: values['reg-last'],
          mobile_number: values['reg-mobile'],
          email: values['reg-email'],
          password: values['reg-password']
        })
        window.location.assign(new URL('profile-setup.html', projectBaseUrl))
        return
      }

      await requestAuth('login.php', {
        mobile_number: values['signin-mobile'],
        password: values['signin-password']
      })
      window.location.assign(new URL(dashboardHomePath, projectBaseUrl))
    } catch (error) {
      showFeedback(error.message)
      button.disabled = false
      button.textContent = originalText
      updateRegistrationState(form)
    }
  }

  function bindEvents() {
    pageCard.querySelectorAll('[data-toggle-password]').forEach(button => button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.togglePassword)
      input.type = input.type === 'password' ? 'text' : 'password'
      button.textContent = input.type === 'password' ? 'Show' : 'Hide'
    }))
    const authForm = pageCard.querySelector('form[data-auth-form]')
    if (['request-otp','verify-otp','reset-password'].includes(authForm?.dataset.authForm)) {
      authForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        const button=authForm.querySelector('button[type="submit"]')
        if (!authForm.checkValidity()) return
        button.disabled=true
        showFeedback('')
        try {
          if (authForm.dataset.authForm === 'request-otp') {
            recoveryMobile=document.getElementById('reset-mobile').value.trim()
            const response=await requestAuth('forgot-password.php',{mobile_number:recoveryMobile})
            if (response.dev_otp) window.alert('DEVELOPMENT-ONLY SIMULATED SMS\nTanodBukid OTP: '+response.dev_otp+'\nExpires in 5 minutes.\n\nNo real SMS was sent.')
            window.location.hash='verify'
          } else if (authForm.dataset.authForm === 'verify-otp') {
            const response=await requestAuth('verify-otp.php',{mobile_number:recoveryMobile,otp:document.getElementById('verify-code').value.trim()})
            recoveryToken=response.reset_token
            window.location.hash='newpassword'
          } else {
            const password=document.getElementById('new-password').value
            const confirm=document.getElementById('confirm-new-password').value
            if (!passwordState(password).valid) throw new Error('Password does not meet the registration password requirements.')
            if (password!==confirm) throw new Error('Passwords do not match.')
            await requestAuth('reset-password.php',{reset_token:recoveryToken,password})
            recoveryToken=''
            window.alert('Password reset successful. Please sign in with your new password.')
            window.location.hash='signin'
          }
        } catch(error) {showFeedback(error.message)}
        finally {button.disabled=false}
      })
    } else {
      authForm?.addEventListener('submit', submitAuthForm)
    }
    if (authForm?.dataset.authForm === 'register') {
      authForm.addEventListener('input', () => updateRegistrationState(authForm))
      updateRegistrationState(authForm)
    }
    pageCard.querySelectorAll('.otp').forEach((input, index, inputs) => input.addEventListener('input', () => {
      if (input.value && index < inputs.length - 1) inputs[index + 1].focus()
    }))
  }

  function render() {
    if (state.route === 'dashboard') {
      window.location.replace(new URL(dashboardHomePath, projectBaseUrl))
      return
    }
    if (!state.route) {
      landingApp.hidden = false
      authApp.hidden = true
      return
    }
    ;({ signin: renderSignin, register: renderRegister, verify: renderVerify, reset: renderReset, newpassword: renderNewPassword }[state.route] || renderSignin)()
  }

  window.addEventListener('hashchange', () => {
    state.route = window.location.hash.slice(1)
    render()
  })
  render()
})()
