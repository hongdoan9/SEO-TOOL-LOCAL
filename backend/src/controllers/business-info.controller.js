import { query } from '../../db.js';

export async function getBusinessInfo(req, res) {
  const { projectId } = req.params;
  try {
    const info = await query.get('SELECT * FROM business_info WHERE project_id = ?', [projectId]);
    if (info) {
      info.phones = info.phones ? JSON.parse(info.phones) : [];
      info.addresses = info.addresses ? JSON.parse(info.addresses) : [];
      res.json(info);
    } else {
      res.json({
        project_id: parseInt(projectId),
        website: '',
        brand: '',
        company_name: '',
        founded_date: '',
        owner: '',
        tax_code: '',
        industry: '',
        products: '',
        features: '',
        employees: '',
        activity_area: '',
        usp: '',
        achievements: '',
        certificates: '',
        search_id: '',
        phones: [],
        addresses: [],
        nap: '',
        bio1: '',
        bio2: '',
        bio3: '',
        email: ''
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function saveBusinessInfo(req, res) {
  const { projectId } = req.params;
  const info = req.body;
  try {
    await query.run(
      `INSERT OR REPLACE INTO business_info (
        project_id, website, brand, company_name, founded_date, owner, tax_code,
        industry, products, features, employees, activity_area, usp, achievements, certificates,
        search_id, phones, addresses, nap, bio1, bio2, bio3, email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        info.website || '',
        info.brand || '',
        info.company_name || '',
        info.founded_date || '',
        info.owner || '',
        info.tax_code || '',
        info.industry || '',
        info.products || '',
        info.features || '',
        info.employees || '',
        info.activity_area || '',
        info.usp || '',
        info.achievements || '',
        info.certificates || '',
        info.search_id || '',
        JSON.stringify(info.phones || []),
        JSON.stringify(info.addresses || []),
        info.nap || '',
        info.bio1 || '',
        info.bio2 || '',
        info.bio3 || '',
        info.email || ''
      ]
    );
    res.json({ message: 'Đã lưu thông tin doanh nghiệp thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
