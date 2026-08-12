import { Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import logo from '../../assets/SkcoolyPlus.png';

const Login = () => {
    return (
        <div className="min-h-screen bg-brand-gray-light flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-poppins">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-brand-gray-light">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-teal/5 blur-3xl"></div>
                <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-brand-green/10 blur-3xl"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md mt-[-5vh] flex flex-col items-center">
                <Link to="/" className="text-4xl font-bold text-brand-teal flex items-end font-heading tracking-tighter hover:opacity-80 transition-opacity">
                    <img src={logo} alt="SkcoolyPlus" className="h-auto w-36 md:w-44 object-contain" />
                </Link>
                <h2 className="mt-2 text-center text-3xl font-heading font-bold text-gray-900 tracking-tight">
                    Welcome back
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 font-primary">
                    Please enter your details to sign in.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-8 shadow-xl shadow-brand-teal/5 sm:rounded-2xl border border-gray-100 sm:px-12 relative z-10">
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="space-y-2 relative">
                            <Label htmlFor="email" className="text-dash-dark font-semibold text-sm">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus-visible:ring-1 focus-visible:ring-brand-teal focus-visible:border-brand-teal text-dash-dark font-medium transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            <Label htmlFor="password" className="text-dash-dark font-semibold text-sm">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus-visible:ring-1 focus-visible:ring-brand-teal focus-visible:border-brand-teal text-dash-dark font-medium shadow-sm transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        className="peer h-4 w-4 appearance-none rounded border border-gray-300 checked:bg-brand-teal checked:border-transparent transition-colors cursor-pointer focus:ring-2 focus:ring-brand-teal/20 focus:outline-none"
                                    />
                                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <label htmlFor="remember" className="text-sm font-primary text-gray-700 block cursor-pointer select-none">
                                    Remember me
                                </label>
                            </div>

                            <a href="#" className="font-semibold text-sm font-primary text-brand-teal hover:text-brand-green transition-colors hover:underline">
                                Forgot password?
                            </a>
                        </div>

                        <Button type="submit" className="w-full h-12 bg-brand-green cursor-pointer hover:bg-brand-dark text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-[15px] mt-6">
                            <LogIn className="w-5 h-5" />
                            Sign in
                        </Button>
                    </form>

                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <p className="flex justify-center text-sm font-primary text-gray-600 gap-1">
                            Don't have an account?
                            <Link to="/signup" className="font-bold text-brand-teal hover:text-brand-green hover:underline transition-colors">
                                Sign up for free
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-gray-500 font-primary">
                    <p>&copy; {new Date().getFullYear()} Skooly Plus. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
