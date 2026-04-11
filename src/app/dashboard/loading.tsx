export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2f5', overflow: 'hidden' }}>
      {/* Sidebar Skeleton */}
      <div style={{ width: '64px', backgroundColor: '#0f1c2e', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', animation: 'pulse 1.5s infinite' }} />
      </div>
      
      {/* Main Content Skeleton */}
      <div style={{ flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ width: '250px', height: '32px', backgroundColor: '#e2e8f0', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
           <div style={{ height: '120px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', animation: 'pulse 1.5s infinite' }} />
           <div style={{ height: '120px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', animation: 'pulse 1.5s infinite' }} />
           <div style={{ height: '120px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', animation: 'pulse 1.5s infinite' }} />
           <div style={{ height: '120px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', animation: 'pulse 1.5s infinite' }} />
        </div>
        
        <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', animation: 'pulse 1.5s infinite' }} />
      </div>

      <style dangerouslySetInnerHTML={{__html: `@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }`}} />
    </div>
  );
}