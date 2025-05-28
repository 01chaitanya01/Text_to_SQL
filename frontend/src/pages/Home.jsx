import DatabaseConfigForm from "../components/DatabaseConfigForm";

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-6 text-blue-500">Connect to Database</h1>
            <DatabaseConfigForm />
        </div>
    );
};

export default Home;
