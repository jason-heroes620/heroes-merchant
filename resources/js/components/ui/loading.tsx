import PulseLoader from "react-spinners/PulseLoader";

const Loading = () => {
    return (
        <div className="flex h-screen items-center justify-center p-4 opacity-40">
            <PulseLoader
                color={"green"}
                size={15}
                aria-label="Loading Spinner"
                data-testid="loader"
            />
        </div>
        // </div>
    );
};

export default Loading;
