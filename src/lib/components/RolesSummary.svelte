<!-- src/lib/components/RolesSummary.svelte -->
<script lang="ts">
  import { students } from '$lib/data';
  import { Award, Target, Camera, PenTool, Mic, BookOpen } from 'lucide-svelte';
  
  const roleIcons: Record<string, any> = {
    'Project Manager & Course Rep': Award,
    'Lead Physicist': Target,
    'Field Researcher': Camera,
    'Technical Writer & Presenter': PenTool,
    'Q&A Specialist': Mic,
    'Research & Documentation Lead': BookOpen
  };
</script>

<div class="roles-summary">
  <h3>📋 Team Roles & Responsibilities</h3>
  <div class="roles-grid">
    {#each students as student}
      {@const RoleIcon = roleIcons[student.role] || Award}
      <div class="role-card">
        <div class="role-icon">
          <RoleIcon size={20} />
        </div>
        <div class="role-info">
          <div class="role-title">{student.role}</div>
          <div class="role-name">{student.fullName}</div>
          <div class="role-desc">{student.roleDescription}</div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .roles-summary {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 16px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }
  
  .roles-summary h3 {
    font-size: 0.9rem;
    margin: 0 0 1rem 0;
    color: #67e8f9;
  }
  
  .roles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 0.75rem;
  }
  
  .role-card {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    padding: 0.75rem;
  }
  
  .role-icon {
    flex-shrink: 0;
    color: #67e8f9;
  }
  
  .role-info {
    flex: 1;
  }
  
  .role-title {
    font-weight: 700;
    font-size: 0.8rem;
    color: #67e8f9;
    margin-bottom: 0.2rem;
  }
  
  .role-name {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 0.2rem;
  }
  
  .role-desc {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.3;
  }
</style>