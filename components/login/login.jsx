import React, { useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from "react-native"
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import { firebaseConfig } from '../../firebase'
import { LOGIN_STATE } from './loginState'
import * as constants from '../../constants'

const Login = () => {
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)

    const [loading, setLoading] = useState(false)
    const [loginView, setLoginView] = useState(LOGIN_STATE.SIGNIN)
    const [user, setUser] = useState({})
    const [formValidations, setFormValidations] = useState({})
    const [authorizated, setAuthorizated] = useState(false)

    const onChangeLoginView = view => {
        setUser({})
        setFormValidations({})
        setLoginView(view)
    }

    const onChangeUser = (k, v) => {
        setUser({...user, [k]: v})

        if (k === constants.EMAIL) {
            if (!v) {
                setFormValidations({ ...formValidations, [k]: constants.REQUIRED_FIELD })
            } else {
                let pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i)
                if (!pattern.test(v)) {
                    setFormValidations({ ...formValidations, [k]: constants.INVALID_EMAIL })
                } else {
                    setFormValidations({ ...formValidations, [k]: undefined })
                }
            }
        } else if ((k === constants.FULLNAME || k === constants.PASSWORD) && !v) {
            setFormValidations({ ...formValidations, [k]: constants.REQUIRED_FIELD })
        } else if (k === constants.CONFIRM_PASSWORD && v !== user.password) {
            setFormValidations({ ...formValidations, [constants.CONFIRM_PASSWORD]: constants.PASSWORD_DO_NOT_MATCH })
        } else {
            setFormValidations({ ...formValidations, [k]: undefined })
        }
    }

    const onSubmit = () => {
        if (loginView === LOGIN_STATE.REGISTER && !user.fullname) {
            setFormValidations({ ...formValidations, [constants.FULLNAME]: constants.REQUIRED_FIELD })
        } else if (!user.email) {
            setFormValidations({ ...formValidations, [constants.EMAIL]: constants.REQUIRED_FIELD })
        } else if ((loginView === LOGIN_STATE.SIGNIN || loginView === LOGIN_STATE.REGISTER) && !user.password) {
            setFormValidations({ ...formValidations, [constants.PASSWORD]: constants.REQUIRED_FIELD })
        } else if (loginView === LOGIN_STATE.REGISTER && user.password !== user.confirmPassword) {
            setFormValidations({ ...formValidations, [constants.CONFIRM_PASSWORD]: constants.PASSWORD_DO_NOT_MATCH })
        } else {
            let pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i)   
            if (!pattern.test(user.email)) {
                setFormValidations({ ...formValidations, [constants.EMAIL]: constants.INVALID_EMAIL })
            } else {
                setLoading(true)
                if (loginView === LOGIN_STATE.REGISTER) {
                    signup()
                } else if (loginView === LOGIN_STATE.SIGNIN) {
                    signin()
                } else {
                    resetPassword()
                }
            }
        }
    }

    const signup = () => {
        createUserWithEmailAndPassword(auth, user.email, user.password)
            .then(() => {
                setLoading(false)
                setAuthorizated(true)
            })
            .catch(e => handleError(e))
    }

    const signin = () => {
        signInWithEmailAndPassword(auth, user.email, user.password)
            .then(() => {
                setLoading(false)
                setAuthorizated(true)
            })
            .catch(e => handleError(e))
    }

    const resetPassword = () => {
        sendPasswordResetEmail(auth, user.email)
            .then(() => {
                setLoading(false)
                setUser({})
                setLoginView(LOGIN_STATE.SIGNIN)
            })
            .catch(e => handleError(e))
    }

    const signOut = () => setAuthorizated(false)

    const handleError = e => {
        ToastAndroid.show(e.message, ToastAndroid.LONG)
        setLoading(false)
    }

    return(
        <View style={styles.container}>
            {
                authorizated
                ? 
                <View>
                    <Text>User {user.email} logged</Text>
                    <TouchableOpacity onPress={signOut}>
                        <Text style={styles.logoutButton}>Logout</Text>
                    </TouchableOpacity>
                </View>
                :
                <View style={styles.card}>
                    {
                        loginView !== LOGIN_STATE.REMEMBER 
                        &&
                        <View style={styles.headers}>
                            <TouchableOpacity onPress={() => onChangeLoginView(LOGIN_STATE.SIGNIN)}>
                                <Text style={[styles.header, loginView === LOGIN_STATE.SIGNIN && styles.selectedHeader]}>{LOGIN_STATE.SIGNIN}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onChangeLoginView(LOGIN_STATE.REGISTER)}>
                                <Text style={[styles.header, loginView === LOGIN_STATE.REGISTER && styles.selectedHeader]}>{LOGIN_STATE.REGISTER}</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    {
                        loginView === LOGIN_STATE.SIGNIN
                        ? <>
                            <Text style={styles.textSmall}>EMAIL</Text>
                            <TextInput style={styles.textInput} value={user.email} onChangeText={value => onChangeUser(constants.EMAIL, value)}></TextInput>
                            {
                                formValidations.email 
                                ? <Text style={styles.textError}>{formValidations.email}</Text>
                                : null
                            }
            
                            <Text style={styles.textSmall}>PASSWORD</Text>
                            <TextInput style={styles.textInput} value={user.password} onChangeText={value => onChangeUser(constants.PASSWORD, value)} secureTextEntry></TextInput>
                            {
                                formValidations.password
                                ? <Text style={styles.textError}>{formValidations.password}</Text>
                                : null
                            }
                        </>
                        : loginView === LOGIN_STATE.REGISTER
                        ? <>
                            <Text style={styles.textSmall}>FULL NAME</Text>
                            <TextInput style={styles.textInput} value={user.fullname} onChangeText={value => onChangeUser(constants.FULLNAME, value)}></TextInput>
                            {
                                formValidations.fullname
                                ? <Text style={styles.textError}>{formValidations.fullname}</Text>
                                : null
                            }

                            <Text style={styles.textSmall}>EMAIL</Text>
                            <TextInput style={styles.textInput} value={user.email} onChangeText={value => onChangeUser(constants.EMAIL, value)}></TextInput>
                            {
                                formValidations.email 
                                ? <Text style={styles.textError}>{formValidations.email}</Text>
                                : null
                            }
            
                            <Text style={styles.textSmall}>PASSWORD</Text>
                            <TextInput style={styles.textInput} value={user.password} onChangeText={value => onChangeUser(constants.PASSWORD, value)} secureTextEntry></TextInput>
                            {
                                formValidations.password
                                ? <Text style={styles.textError}>{formValidations.password}</Text>
                                : null
                            }

                            <Text style={styles.textSmall}>CONFIRM PASSWORD</Text>
                            <TextInput style={styles.textInput} value={user.confirmPassword} onChangeText={value => onChangeUser(constants.CONFIRM_PASSWORD, value)} secureTextEntry></TextInput>
                            {
                                formValidations.confirmPassword
                                ? <Text style={styles.textError}>{formValidations.confirmPassword}</Text>
                                : null
                            }
                        </>
                        : <>
                            <Text style={styles.textSmall}>EMAIL</Text>
                            <TextInput style={styles.textInput} value={user.email} onChangeText={value => onChangeUser(constants.EMAIL, value)}></TextInput>
                            {
                                formValidations.email 
                                ? <Text style={styles.textError}>{formValidations.email}</Text>
                                : null
                            }
                        </>
                    }
                    <TouchableOpacity onPress={() => onSubmit()} disabled={loading}>
                        <Text style={styles.submitButton}>{loading ?  <ActivityIndicator size="small" color="#2E3137" /> : 'Submit'}</Text>
                    </TouchableOpacity>
                    {
                        loginView === LOGIN_STATE.SIGNIN
                        ?
                        <TouchableOpacity onPress={() => onChangeLoginView(LOGIN_STATE.REMEMBER)}>
                            <Text style={styles.forgetText}>FORGET YOUR PASSWORD?</Text>
                        </TouchableOpacity>
                        : loginView === LOGIN_STATE.REMEMBER
                        ?
                        <TouchableOpacity onPress={() => onChangeLoginView(LOGIN_STATE.SIGNIN)}>
                            <Text style={styles.forgetText}>BACK</Text>
                        </TouchableOpacity>
                        : null
                    }
                </View>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#42C582',
        height: '100%',
    },
    card: {
        backgroundColor: '#2E3137',
        borderRadius: 15,
        padding: 15,
        paddingLeft: 35,
        paddingRight: 35.
    },
    headers: {
        flexDirection: 'row', 
        flexWrap: 'wrap'
    },
    header: {
        color: '#596373',
        fontSize: 22,
        marginLeft: 20,
        marginRight: 20,
    },
    selectedHeader: {
        color: '#FEFFFF',
    },
    textSmall: {
        color: '#596373',
        fontSize: 12,
        paddingBottom: 5,
        paddingTop: 10
    },
    textInput: {
        backgroundColor: '#545D6A',
        color: '#EBEFF6',
        borderRadius: 5,
        width: 200,
        paddingLeft: 5,
        paddingRight: 5,
    },
    textError: {
        color: '#DF5150',
        fontSize: 12,
    },
    submitButton: {
        color: '#FEFFFF',
        textAlign: 'center',
        backgroundColor: '#42C582',
        borderRadius: 5,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 25,
        paddingRight: 25,
        marginTop: 15,
        marginLeft: 'auto',
        marginRight: 'auto',
        marginBottom: 5,
    },
    forgetText: {
        fontWeight: 'bold',
        color: '#596373',
        fontSize: 12,
        textDecorationLine: 'underline',
        textAlign: 'center',
    },
    logoutButton: {
        backgroundColor: '#2E3137',
        color: '#FEFFFF',
        textAlign: 'center',
        borderRadius: 5,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 25,
        paddingRight: 25,
        marginTop: 15,
        marginLeft: 'auto',
        marginRight: 'auto',
    }
})

export default Login