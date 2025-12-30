import { Header } from '@/components/Header';
import HeroMetric from '@/components/HeroMetric';
import QualityIndicators from '@/components/QualityIndicators';
import RPCTable from '@/components/RPCTable';
import Commentary from '@/components/Commentary';
import DeveloperSection from '@/components/DeveloperSection';
import Footer from '@/components/Footer';
import { useNetworkData } from '@/hooks/useNetworkData';

const Index = () => {
  const { isLoading, error } = useNetworkData();

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isLive={false} />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-destructive font-mono">
            Error loading network data
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header isLive={!isLoading && !error} />
      
      <main className="flex-1">
        <div className="container max-w-4xl">
          <HeroMetric />
          <QualityIndicators />
          <RPCTable />
          <Commentary />
          <DeveloperSection />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
