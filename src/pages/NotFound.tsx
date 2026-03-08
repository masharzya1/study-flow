import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-sm"
      >
        <div className="text-8xl font-bold text-foreground/10 select-none mb-2">404</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">পেজটি পাওয়া যায়নি</h1>
        <p className="text-sm text-muted-foreground mb-8">
          তুমি যে পেজটি খুঁজছো সেটি সরানো হয়েছে বা এটির অস্তিত্ব নেই।
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              হোমে ফিরে যাও
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
            আগের পেজে যাও
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
