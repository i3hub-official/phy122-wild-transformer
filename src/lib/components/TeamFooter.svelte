<!-- src/lib/components/TeamFooter.svelte -->
<script lang="ts">
  import { students, getWhatsAppLink, type Student } from '$lib/data';
  import { Phone, Users, Building2, GraduationCap, Award, Target, PenTool, Camera, Mic, BookOpen } from 'lucide-svelte';

  // Role icons mapping
  const roleIcons: Record<string, any> = {
    'Project Manager & Course Rep': Award,
    'Lead Physicist': Target,
    'Field Researcher': Camera,
    'Technical Writer & Presenter': PenTool,
    'Q&A Specialist': Mic,
    'Research & Documentation Lead': BookOpen
  };
</script>

<div class="team-footer">
  <div class="team-header">
    <Users size={18} />
    <h4>COLPAS Research Group</h4>
  </div>
  
  <div class="team-grid">
    {#each students as student (student.matricNumber)}
      {@const RoleIcon = roleIcons[student.role] || Award}
      <div class="team-card">
        <div class="member-header">
          <div class="member-name">{student.fullName}</div>
          <div class="member-role">
            <RoleIcon size={12} />
            <span>{student.role}</span>
          </div>
        </div>
        
        <div class="member-details">
          <div class="detail-item">
            <GraduationCap size={12} />
            <span class="detail-label">Matric:</span>
            <span class="detail-value">{student.matricNumber}</span>
          </div>
          <div class="detail-item">
            <Building2 size={12} />
            <span class="detail-label">Dept:</span>
            <span class="detail-value">{student.department}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">College:</span>
            <span class="detail-value">{student.college}</span>
          </div>
          <div class="detail-item">
            <Phone size={12} />
            <span class="detail-label">WhatsApp:</span>
            <a href={getWhatsAppLink(student.whatsappNumber)} target="_blank" rel="noopener noreferrer">
              {student.whatsappNumber}
            </a>
          </div>
          <div class="detail-item role-description">
            <span class="detail-label">Role:</span>
            <span class="detail-value role-text">{student.roleDescription}</span>
          </div>
        </div>
      </div>
    {/each}
  </div>
  
  <!-- Q&A Section Note -->
  <div class="qa-section">
    <div class="qa-header">
      <Mic size={14} />
      <strong>Question & Answer Section</strong>
    </div>
    <p>All members of the college(s) will participate in the Q&A session, with the Q&A Specialist coordinating responses and ensuring comprehensive coverage of all questions.</p>
  </div>
  
  <div class="footer-note">
    <p>📄 For the printed report: All team members' active WhatsApp contacts and assigned roles are listed above.</p>
    <p class="citation">COLPAS Group • Department of Physics • PHY122 Electromagnetic Induction • {new Date().getFullYear()}</p>
  </div>
</div>

<style>
  .team-footer {
    background: linear-gradient(135deg, #0a0f1a 0%, #0a0a0f 100%);
    border-radius: 24px;
    border: 1px solid rgba(103, 232, 249, 0.15);
    padding: 1.5rem;
    margin-top: 2rem;
  }

  .team-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid rgba(103, 232, 249, 0.15);
  }

  .team-header h4 {
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0;
    color: #67e8f9;
  }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .team-card {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid rgba(103, 232, 249, 0.1);
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .team-card:hover {
    transform: translateY(-2px);
    border-color: rgba(103, 232, 249, 0.3);
  }

  .member-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(103, 232, 249, 0.1);
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .member-name {
    font-weight: 700;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .member-role {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: rgba(103, 232, 249, 0.15);
    padding: 0.2rem 0.5rem;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 600;
    color: #67e8f9;
  }

  .member-details {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
  }

  .detail-item svg {
    flex-shrink: 0;
    color: #67e8f9;
  }

  .detail-label {
    color: rgba(255, 255, 255, 0.4);
    min-width: 55px;
    font-weight: 500;
  }

  .detail-value {
    color: rgba(255, 255, 255, 0.7);
  }

  .detail-item a {
    color: #67e8f9;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .detail-item a:hover {
    color: #22d3ee;
    text-decoration: underline;
  }

  .role-description {
    margin-top: 0.25rem;
    padding-top: 0.25rem;
    border-top: 1px dashed rgba(103, 232, 249, 0.1);
  }

  .role-text {
    font-size: 0.65rem;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.55);
  }

  .qa-section {
    background: rgba(103, 232, 249, 0.05);
    border-radius: 12px;
    padding: 1rem;
    margin: 1rem 0;
    border-left: 3px solid #67e8f9;
  }

  .qa-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    color: #67e8f9;
    font-size: 0.8rem;
  }

  .qa-section p {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    line-height: 1.5;
  }

  .footer-note {
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid rgba(103, 232, 249, 0.1);
  }

  .footer-note p {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
    margin: 0.25rem 0;
  }

  .citation {
    font-family: 'Space Mono', monospace;
    font-size: 0.65rem;
    color: rgba(103, 232, 249, 0.5);
  }

  @media (max-width: 640px) {
    .team-footer {
      padding: 1rem;
    }
    
    .team-grid {
      grid-template-columns: 1fr;
    }
    
    .detail-item {
      flex-wrap: wrap;
    }
    
    .detail-label {
      min-width: auto;
    }
    
    .member-header {
      flex-direction: column;
    }
  }
</style>