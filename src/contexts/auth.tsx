import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "services/api";

interface User {
	id: string;
	login: string;
	name: string;
	avatarUrl: string;
}

interface AuthResponse {
	token: string;
	user: User;
}

interface AuthContextData {
	user: User | null;
	signInUrl: string;
	signOut: () => void;
}

interface Props {
	children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

export const AuthProvider = ({ children }: Props) => {
	const [user, setUser] = useState<User | null>(null);

	const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=${
		import.meta.env.VITE_CLIENT_ID
	}`;

	const signIn = async (gitHubCode: string) => {
		const { data } = await api.post<AuthResponse>("authenticate", {
			code: gitHubCode,
		});

		const { token, user } = data;

		localStorage.setItem("@dowhile:token", token);

		api.defaults.headers.common.authorization = `Bearer ${token}`;

		setUser(user);
	};

	const signOut = () => {
		setUser(null);
		localStorage.removeItem("@dowhile:token");
	};

	useEffect(() => {
		const getProfile = async (token: string) => {
			api.defaults.headers.common.authorization = `Bearer ${token}`;
			const { data } = await api.get<User>("profile");

			setUser(data);
		};

		const token = localStorage.getItem("@dowhile:token");

		if (token) {
			getProfile(token);
		}
	}, []);

	useEffect(() => {
		const url = window.location.href;
		const hasGitHubCode = url.includes("?code=");

		if (hasGitHubCode) {
			const [urlWithoutCode, gitHubCode] = url.split("?code=");

			window.history.pushState({}, "", urlWithoutCode);

			signIn(gitHubCode);
		}
	}, []);

	return (
		<AuthContext.Provider value={{ signInUrl, user, signOut }}>
			{children}
		</AuthContext.Provider>
	);
};
