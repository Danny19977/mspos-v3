package dashboard

import (
	"fmt"
	"math"

	"github.com/danny19977/mspos-api-v3/database"
	"github.com/gofiber/fiber/v2"
)

// calculate the ND by Country and Province
func NdTableViewProvince(c *fiber.Ctx) error {
	db := database.DB

	country_uuid  := c.Query("country_uuid")
	province_uuid := c.Query("province_uuid")
	start_date    := c.Query("start_date")
	end_date      := c.Query("end_date")

	type Row struct {
		TerritoryName  string  `json:"territory_name"`
		TerritoryUUID  string  `json:"territory_uuid"`
		TerritoryLevel string  `json:"territory_level"`
		BrandName      string  `json:"brand_name"`
		BrandUUID      string  `json:"brand_uuid"`
		NdBrand        int64   `json:"nd_brand"`
		TotalPosforms  int64   `json:"total_posforms"`
		TotalPosVisit  int64   `json:"total_pos_visit"`
		UniversePos    int64   `json:"universe_pos"`
		NdPercent      float64 `json:"nd_percent"`
		ReachRate      float64 `json:"reach_rate"`
	}
	var results []Row

	sqlQuery := `
		WITH vc AS (
			SELECT pf.province_uuid,
				COUNT(DISTINCT pf.uuid)     AS total_posforms,
				COUNT(DISTINCT pf.pos_uuid) AS total_pos_visit
			FROM pos_forms pf
			WHERE pf.country_uuid = ?
			AND (? = '' OR pf.province_uuid = ?)
			AND pf.created_at BETWEEN ? AND ?
			AND pf.deleted_at IS NULL
			GROUP BY pf.province_uuid
		),
		uc AS (
			SELECT p.province_uuid, COUNT(DISTINCT p.uuid) AS universe_pos
			FROM pos p
			WHERE p.country_uuid = ?
			AND (? = '' OR p.province_uuid = ?)
			AND p.deleted_at IS NULL
			GROUP BY p.province_uuid
		)
		SELECT
			provinces.name                                 AS territory_name,
			provinces.uuid                                 AS territory_uuid,
			'province'                                     AS territory_level,
			b.name                                         AS brand_name,
			b.uuid                                         AS brand_uuid,
			COUNT(DISTINCT pfi.pos_form_uuid)              AS nd_brand,
			COALESCE(vc.total_posforms, 0)                 AS total_posforms,
			COALESCE(vc.total_pos_visit, 0)                AS total_pos_visit,
			COALESCE(uc.universe_pos, 0)                   AS universe_pos,
			COALESCE(ROUND(COUNT(DISTINCT pfi.pos_form_uuid)::numeric * 100.0
				/ NULLIF(vc.total_posforms, 0), 2), 0)     AS nd_percent,
			COALESCE(ROUND(vc.total_pos_visit::numeric * 100.0
				/ NULLIF(uc.universe_pos, 0), 2), 0)       AS reach_rate
		FROM pos_form_items pfi
		INNER JOIN pos_forms pf ON pfi.pos_form_uuid = pf.uuid
		INNER JOIN brands    b  ON pfi.brand_uuid    = b.uuid
		INNER JOIN provinces    ON pf.province_uuid  = provinces.uuid
		LEFT  JOIN vc           ON vc.province_uuid  = provinces.uuid
		LEFT  JOIN uc           ON uc.province_uuid  = provinces.uuid
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL
		GROUP BY provinces.name, provinces.uuid, b.name, b.uuid,
		         vc.total_posforms, vc.total_pos_visit, uc.universe_pos
		ORDER BY provinces.name, nd_percent DESC
	`
	if err := db.Raw(sqlQuery,
		country_uuid, province_uuid, province_uuid, start_date, end_date,
		country_uuid, province_uuid, province_uuid,
		country_uuid, province_uuid, province_uuid, start_date, end_date,
	).Scan(&results).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status": "error", "message": "Failed to fetch data", "error": err.Error(),
		})
	}
	if results == nil {
		results = []Row{}
	}
	return c.JSON(fiber.Map{"status": "success", "message": "chartData data", "data": results})
}

// calculate the ND by Area Found here
func NdTableViewArea(c *fiber.Ctx) error {
	db := database.DB

	country_uuid  := c.Query("country_uuid")
	province_uuid := c.Query("province_uuid")
	area_uuid     := c.Query("area_uuid")
	start_date    := c.Query("start_date")
	end_date      := c.Query("end_date")

	type Row struct {
		TerritoryName  string  `json:"territory_name"`
		TerritoryUUID  string  `json:"territory_uuid"`
		TerritoryLevel string  `json:"territory_level"`
		BrandName      string  `json:"brand_name"`
		BrandUUID      string  `json:"brand_uuid"`
		NdBrand        int64   `json:"nd_brand"`
		TotalPosforms  int64   `json:"total_posforms"`
		TotalPosVisit  int64   `json:"total_pos_visit"`
		UniversePos    int64   `json:"universe_pos"`
		NdPercent      float64 `json:"nd_percent"`
		ReachRate      float64 `json:"reach_rate"`
	}
	var results []Row

	sqlQuery := `
		WITH vc AS (
			SELECT pf.area_uuid,
				COUNT(DISTINCT pf.uuid)     AS total_posforms,
				COUNT(DISTINCT pf.pos_uuid) AS total_pos_visit
			FROM pos_forms pf
			WHERE pf.country_uuid = ?
			AND (? = '' OR pf.province_uuid = ?)
			AND (? = '' OR pf.area_uuid = ?)
			AND pf.created_at BETWEEN ? AND ?
			AND pf.deleted_at IS NULL
			GROUP BY pf.area_uuid
		),
		uc AS (
			SELECT p.area_uuid, COUNT(DISTINCT p.uuid) AS universe_pos
			FROM pos p
			WHERE p.country_uuid = ?
			AND (? = '' OR p.province_uuid = ?)
			AND (? = '' OR p.area_uuid = ?)
			AND p.deleted_at IS NULL
			GROUP BY p.area_uuid
		)
		SELECT
			areas.name                                     AS territory_name,
			areas.uuid                                     AS territory_uuid,
			'area'                                         AS territory_level,
			b.name                                         AS brand_name,
			b.uuid                                         AS brand_uuid,
			COUNT(DISTINCT pfi.pos_form_uuid)              AS nd_brand,
			COALESCE(vc.total_posforms, 0)                 AS total_posforms,
			COALESCE(vc.total_pos_visit, 0)                AS total_pos_visit,
			COALESCE(uc.universe_pos, 0)                   AS universe_pos,
			COALESCE(ROUND(COUNT(DISTINCT pfi.pos_form_uuid)::numeric * 100.0
				/ NULLIF(vc.total_posforms, 0), 2), 0)     AS nd_percent,
			COALESCE(ROUND(vc.total_pos_visit::numeric * 100.0
				/ NULLIF(uc.universe_pos, 0), 2), 0)       AS reach_rate
		FROM pos_form_items pfi
		INNER JOIN pos_forms pf ON pfi.pos_form_uuid = pf.uuid
		INNER JOIN brands    b  ON pfi.brand_uuid    = b.uuid
		INNER JOIN areas        ON pf.area_uuid      = areas.uuid
		LEFT  JOIN vc           ON vc.area_uuid      = areas.uuid
		LEFT  JOIN uc           ON uc.area_uuid      = areas.uuid
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid = ?)
		AND (? = '' OR pf.area_uuid = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL
		GROUP BY areas.name, areas.uuid, b.name, b.uuid,
		         vc.total_posforms, vc.total_pos_visit, uc.universe_pos
		ORDER BY areas.name, nd_percent DESC
	`
	if err := db.Raw(sqlQuery,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid, start_date, end_date,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid, start_date, end_date,
	).Scan(&results).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status": "error", "message": "Failed to fetch data", "error": err.Error(),
		})
	}
	if results == nil {
		results = []Row{}
	}
	return c.JSON(fiber.Map{"status": "success", "message": "chartData data", "data": results})
}

// calculate the ND by Subarea Found here
func NdTableViewSubArea(c *fiber.Ctx) error {
	db := database.DB

	country_uuid  := c.Query("country_uuid")
	province_uuid := c.Query("province_uuid")
	area_uuid     := c.Query("area_uuid")
	sub_area_uuid := c.Query("sub_area_uuid")
	start_date    := c.Query("start_date")
	end_date      := c.Query("end_date")

	type Row struct {
		TerritoryName  string  `json:"territory_name"`
		TerritoryUUID  string  `json:"territory_uuid"`
		TerritoryLevel string  `json:"territory_level"`
		BrandName      string  `json:"brand_name"`
		BrandUUID      string  `json:"brand_uuid"`
		NdBrand        int64   `json:"nd_brand"`
		TotalPosforms  int64   `json:"total_posforms"`
		TotalPosVisit  int64   `json:"total_pos_visit"`
		UniversePos    int64   `json:"universe_pos"`
		NdPercent      float64 `json:"nd_percent"`
		ReachRate      float64 `json:"reach_rate"`
	}
	var results []Row

	sqlQuery := `
		WITH vc AS (
			SELECT pf.sub_area_uuid,
				COUNT(DISTINCT pf.uuid)     AS total_posforms,
				COUNT(DISTINCT pf.pos_uuid) AS total_pos_visit
			FROM pos_forms pf
			WHERE pf.country_uuid = ?
			AND (? = '' OR pf.province_uuid = ?)
			AND (? = '' OR pf.area_uuid = ?)
			AND (? = '' OR pf.sub_area_uuid = ?)
			AND pf.created_at BETWEEN ? AND ?
			AND pf.deleted_at IS NULL
			GROUP BY pf.sub_area_uuid
		),
		uc AS (
			SELECT p.sub_area_uuid, COUNT(DISTINCT p.uuid) AS universe_pos
			FROM pos p
			WHERE p.country_uuid = ?
			AND (? = '' OR p.province_uuid = ?)
			AND (? = '' OR p.area_uuid = ?)
			AND (? = '' OR p.sub_area_uuid = ?)
			AND p.deleted_at IS NULL
			GROUP BY p.sub_area_uuid
		)
		SELECT
			sa.name                                        AS territory_name,
			sa.uuid                                        AS territory_uuid,
			'subarea'                                      AS territory_level,
			b.name                                         AS brand_name,
			b.uuid                                         AS brand_uuid,
			COUNT(DISTINCT pfi.pos_form_uuid)              AS nd_brand,
			COALESCE(vc.total_posforms, 0)                 AS total_posforms,
			COALESCE(vc.total_pos_visit, 0)                AS total_pos_visit,
			COALESCE(uc.universe_pos, 0)                   AS universe_pos,
			COALESCE(ROUND(COUNT(DISTINCT pfi.pos_form_uuid)::numeric * 100.0
				/ NULLIF(vc.total_posforms, 0), 2), 0)     AS nd_percent,
			COALESCE(ROUND(vc.total_pos_visit::numeric * 100.0
				/ NULLIF(uc.universe_pos, 0), 2), 0)       AS reach_rate
		FROM pos_form_items pfi
		INNER JOIN pos_forms pf ON pfi.pos_form_uuid = pf.uuid
		INNER JOIN brands    b  ON pfi.brand_uuid    = b.uuid
		INNER JOIN sub_areas sa ON pf.sub_area_uuid  = sa.uuid
		LEFT  JOIN vc           ON vc.sub_area_uuid  = sa.uuid
		LEFT  JOIN uc           ON uc.sub_area_uuid  = sa.uuid
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid = ?)
		AND (? = '' OR pf.area_uuid = ?)
		AND (? = '' OR pf.sub_area_uuid = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL
		GROUP BY sa.name, sa.uuid, b.name, b.uuid,
		         vc.total_posforms, vc.total_pos_visit, uc.universe_pos
		ORDER BY sa.name, nd_percent DESC
	`
	if err := db.Raw(sqlQuery,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid, sub_area_uuid, sub_area_uuid, start_date, end_date,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid, sub_area_uuid, sub_area_uuid,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid, sub_area_uuid, sub_area_uuid, start_date, end_date,
	).Scan(&results).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status": "error", "message": "Failed to fetch data", "error": err.Error(),
		})
	}
	if results == nil {
		results = []Row{}
	}
	return c.JSON(fiber.Map{"status": "success", "message": "chartData data", "data": results})
}

// calculate the ND by Commune Found here
func NdTableViewCommune(c *fiber.Ctx) error {
	db := database.DB

	country_uuid  := c.Query("country_uuid")
	province_uuid := c.Query("province_uuid")
	area_uuid     := c.Query("area_uuid")
	sub_area_uuid := c.Query("sub_area_uuid")
	commune_uuid  := c.Query("commune_uuid")
	start_date    := c.Query("start_date")
	end_date      := c.Query("end_date")

	type Row struct {
		TerritoryName  string  `json:"territory_name"`
		TerritoryUUID  string  `json:"territory_uuid"`
		TerritoryLevel string  `json:"territory_level"`
		BrandName      string  `json:"brand_name"`
		BrandUUID      string  `json:"brand_uuid"`
		NdBrand        int64   `json:"nd_brand"`
		TotalPosforms  int64   `json:"total_posforms"`
		TotalPosVisit  int64   `json:"total_pos_visit"`
		UniversePos    int64   `json:"universe_pos"`
		NdPercent      float64 `json:"nd_percent"`
		ReachRate      float64 `json:"reach_rate"`
	}
	var results []Row

	sqlQuery := `
		WITH vc AS (
			SELECT pf.commune_uuid,
				COUNT(DISTINCT pf.uuid)     AS total_posforms,
				COUNT(DISTINCT pf.pos_uuid) AS total_pos_visit
			FROM pos_forms pf
			WHERE pf.country_uuid = ?
			AND (? = '' OR pf.province_uuid = ?)
			AND (? = '' OR pf.area_uuid = ?)
			AND (? = '' OR pf.sub_area_uuid = ?)
			AND (? = '' OR pf.commune_uuid = ?)
			AND pf.created_at BETWEEN ? AND ?
			AND pf.deleted_at IS NULL
			GROUP BY pf.commune_uuid
		),
		uc AS (
			SELECT p.commune_uuid, COUNT(DISTINCT p.uuid) AS universe_pos
			FROM pos p
			WHERE p.country_uuid = ?
			AND (? = '' OR p.province_uuid = ?)
			AND (? = '' OR p.area_uuid = ?)
			AND (? = '' OR p.sub_area_uuid = ?)
			AND (? = '' OR p.commune_uuid = ?)
			AND p.deleted_at IS NULL
			GROUP BY p.commune_uuid
		)
		SELECT
			cm.name                                        AS territory_name,
			cm.uuid                                        AS territory_uuid,
			'commune'                                      AS territory_level,
			b.name                                         AS brand_name,
			b.uuid                                         AS brand_uuid,
			COUNT(DISTINCT pfi.pos_form_uuid)              AS nd_brand,
			COALESCE(vc.total_posforms, 0)                 AS total_posforms,
			COALESCE(vc.total_pos_visit, 0)                AS total_pos_visit,
			COALESCE(uc.universe_pos, 0)                   AS universe_pos,
			COALESCE(ROUND(COUNT(DISTINCT pfi.pos_form_uuid)::numeric * 100.0
				/ NULLIF(vc.total_posforms, 0), 2), 0)     AS nd_percent,
			COALESCE(ROUND(vc.total_pos_visit::numeric * 100.0
				/ NULLIF(uc.universe_pos, 0), 2), 0)       AS reach_rate
		FROM pos_form_items pfi
		INNER JOIN pos_forms pf ON pfi.pos_form_uuid = pf.uuid
		INNER JOIN brands    b  ON pfi.brand_uuid    = b.uuid
		INNER JOIN communes  cm ON pf.commune_uuid   = cm.uuid
		LEFT  JOIN vc           ON vc.commune_uuid   = cm.uuid
		LEFT  JOIN uc           ON uc.commune_uuid   = cm.uuid
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid = ?)
		AND (? = '' OR pf.area_uuid = ?)
		AND (? = '' OR pf.sub_area_uuid = ?)
		AND (? = '' OR pf.commune_uuid = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL
		GROUP BY cm.name, cm.uuid, b.name, b.uuid,
		         vc.total_posforms, vc.total_pos_visit, uc.universe_pos
		ORDER BY cm.name, nd_percent DESC
	`
	if err := db.Raw(sqlQuery,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid, sub_area_uuid, sub_area_uuid, commune_uuid, commune_uuid, start_date, end_date,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid, sub_area_uuid, sub_area_uuid, commune_uuid, commune_uuid,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid, sub_area_uuid, sub_area_uuid, commune_uuid, commune_uuid, start_date, end_date,
	).Scan(&results).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status": "error", "message": "Failed to fetch data", "error": err.Error(),
		})
	}
	if results == nil {
		results = []Row{}
	}
	return c.JSON(fiber.Map{"status": "success", "message": "chartData data", "data": results})
}

// Line chart for sum brand by month
func NdTotalByBrandByMonth(c *fiber.Ctx) error {
	db := database.DB

	country_uuid := c.Query("country_uuid")
	year := c.Query("year")

	var results []struct {
		Brand    string  `json:"brand"`
		Month    int     `json:"month"`
		Presence int     `json:"presence"`
		Pourcent float64 `json:"pourcent"`
	}

	sqlQuery := `
		SELECT
			brands.name AS brand,
			EXTRACT(MONTH FROM pos_forms.created_at) AS month,
			COUNT(brands.name) AS presence,
			(COUNT(brands.name) * 100 / (
				SELECT COUNT(pos_forms.uuid) FROM pos_forms 
				WHERE pos_forms.country_uuid = ? 
				AND EXTRACT(YEAR FROM pos_forms.created_at) = ?
				AND pos_forms.deleted_at IS NULL
			)) AS pourcent
		FROM pos_form_items 
		INNER JOIN pos_forms ON pos_form_items.pos_form_uuid = pos_forms.uuid
		INNER JOIN brands ON pos_form_items.brand_uuid = brands.uuid
		INNER JOIN provinces ON pos_forms.province_uuid = provinces.uuid
		WHERE pos_forms.country_uuid = ? AND EXTRACT(YEAR FROM pos_forms.created_at) = ?
		AND pos_forms.deleted_at IS NULL
		GROUP BY brands.name, month
		ORDER BY brands.name, month ASC;
	`
	rows, err := db.Raw(sqlQuery, country_uuid, year, country_uuid, year).Rows()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch data",
			"error":   err.Error(),
		})
	}
	defer rows.Close()
	for rows.Next() {
		var brand string
		var month, presence int
		var pourcent float64
		if err := rows.Scan(&brand, &month, &presence, &pourcent); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"status":  "error",
				"message": "Failed to scan data",
				"error":   err.Error(),
			})
		}
		results = append(results, struct {
			Brand    string  `json:"brand"`
			Month    int     `json:"month"`
			Presence int     `json:"presence"`
			Pourcent float64 `json:"pourcent"`
		}{
			Brand:    brand,
			Month:    month,
			Presence: presence,
			Pourcent: pourcent,
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Total count by brand grouped by month for the year",
		"data":    results,
	})
}

// Bar chart for ND by Province with aggregated data
func NdBarChartProvince(c *fiber.Ctx) error {
	db := database.DB

	country_uuid  := c.Query("country_uuid")
	province_uuid := c.Query("province_uuid")
	start_date    := c.Query("start_date")
	end_date      := c.Query("end_date")

	type BrandItem struct {
		BrandName string  `json:"brand_name"`
		BrandUUID string  `json:"brand_uuid"`
		NdPos     int64   `json:"nd_pos"`
		TotalPos  int64   `json:"total_pos"`
		NdPercent float64 `json:"nd_percent"`
	}
	type BarGroup struct {
		TerritoryName string      `json:"territory_name"`
		TerritoryUUID string      `json:"territory_uuid"`
		TotalPos      int64       `json:"total_pos"`
		UniversePos   int64       `json:"universe_pos"`
		ReachRate     float64     `json:"reach_rate"`
		Brands        []BrandItem `json:"brands"`
	}

	type flatRow struct {
		TerritoryName string  `json:"territory_name"`
		TerritoryUUID string  `json:"territory_uuid"`
		BrandName     string  `json:"brand_name"`
		BrandUUID     string  `json:"brand_uuid"`
		NdPos         int64   `json:"nd_pos"`
		TotalPos      int64   `json:"total_pos"`
		NdPercent     float64 `json:"nd_percent"`
	}
	var rows []flatRow

	err := db.Raw(`
		WITH vc AS (
			SELECT pf.province_uuid,
				COUNT(DISTINCT pf.uuid) AS total_posforms
			FROM pos_forms pf
			WHERE pf.country_uuid = ?
			AND (? = '' OR pf.province_uuid = ?)
			AND pf.created_at BETWEEN ? AND ?
			AND pf.deleted_at IS NULL
			GROUP BY pf.province_uuid
		)
		SELECT
			provinces.name                                AS territory_name,
			provinces.uuid                                AS territory_uuid,
			b.name                                        AS brand_name,
			b.uuid                                        AS brand_uuid,
			COUNT(DISTINCT pfi.pos_form_uuid)             AS nd_pos,
			COALESCE(vc.total_posforms, 0)                AS total_pos,
			COALESCE(ROUND(COUNT(DISTINCT pfi.pos_form_uuid)::numeric * 100.0
				/ NULLIF(vc.total_posforms, 0), 2), 0)    AS nd_percent
		FROM pos_form_items pfi
		INNER JOIN pos_forms pf ON pfi.pos_form_uuid = pf.uuid
		INNER JOIN brands    b  ON pfi.brand_uuid    = b.uuid
		INNER JOIN provinces    ON pf.province_uuid  = provinces.uuid
		LEFT  JOIN vc           ON vc.province_uuid  = provinces.uuid
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL
		GROUP BY provinces.name, provinces.uuid, b.name, b.uuid, vc.total_posforms
		ORDER BY provinces.name, nd_percent DESC`,
		country_uuid, province_uuid, province_uuid, start_date, end_date,
		country_uuid, province_uuid, province_uuid, start_date, end_date,
	).Scan(&rows).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "error": err.Error()})
	}

	groupMap := make(map[string]*BarGroup)
	order := []string{}
	for _, r := range rows {
		if _, ok := groupMap[r.TerritoryUUID]; !ok {
			groupMap[r.TerritoryUUID] = &BarGroup{TerritoryName: r.TerritoryName, TerritoryUUID: r.TerritoryUUID, TotalPos: r.TotalPos, Brands: []BrandItem{}}
			order = append(order, r.TerritoryUUID)
		}
		groupMap[r.TerritoryUUID].Brands = append(groupMap[r.TerritoryUUID].Brands, BrandItem{BrandName: r.BrandName, BrandUUID: r.BrandUUID, NdPos: r.NdPos, TotalPos: r.TotalPos, NdPercent: r.NdPercent})
	}
	results := make([]BarGroup, 0, len(order))
	for _, uuid := range order {
		results = append(results, *groupMap[uuid])
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Bar chart data for ND by Province", "data": results})
}

// Bar chart for ND by Area with aggregated data - shows ALL areas within a province
func NdBarChartArea(c *fiber.Ctx) error {
	db := database.DB

	country_uuid  := c.Query("country_uuid")
	province_uuid := c.Query("province_uuid")
	area_uuid     := c.Query("area_uuid")
	start_date    := c.Query("start_date")
	end_date      := c.Query("end_date")

	type BrandItem struct {
		BrandName string  `json:"brand_name"`
		BrandUUID string  `json:"brand_uuid"`
		NdPos     int64   `json:"nd_pos"`
		TotalPos  int64   `json:"total_pos"`
		NdPercent float64 `json:"nd_percent"`
	}
	type BarGroup struct {
		TerritoryName string      `json:"territory_name"`
		TerritoryUUID string      `json:"territory_uuid"`
		TotalPos      int64       `json:"total_pos"`
		Brands        []BrandItem `json:"brands"`
	}
	type flatRow struct {
		TerritoryName string  `json:"territory_name"`
		TerritoryUUID string  `json:"territory_uuid"`
		BrandName     string  `json:"brand_name"`
		BrandUUID     string  `json:"brand_uuid"`
		NdPos         int64   `json:"nd_pos"`
		TotalPos      int64   `json:"total_pos"`
		NdPercent     float64 `json:"nd_percent"`
	}
	var rows []flatRow

	err := db.Raw(`
		WITH vc AS (
			SELECT pf.area_uuid,
				COUNT(DISTINCT pf.uuid) AS total_posforms
			FROM pos_forms pf
			WHERE pf.country_uuid = ?
			AND (? = '' OR pf.province_uuid = ?)
			AND (? = '' OR pf.area_uuid = ?)
			AND pf.created_at BETWEEN ? AND ?
			AND pf.deleted_at IS NULL
			GROUP BY pf.area_uuid
		)
		SELECT
			areas.name                                    AS territory_name,
			areas.uuid                                    AS territory_uuid,
			b.name                                        AS brand_name,
			b.uuid                                        AS brand_uuid,
			COUNT(DISTINCT pfi.pos_form_uuid)             AS nd_pos,
			COALESCE(vc.total_posforms, 0)                AS total_pos,
			COALESCE(ROUND(COUNT(DISTINCT pfi.pos_form_uuid)::numeric * 100.0
				/ NULLIF(vc.total_posforms, 0), 2), 0)    AS nd_percent
		FROM pos_form_items pfi
		INNER JOIN pos_forms pf ON pfi.pos_form_uuid = pf.uuid
		INNER JOIN brands    b  ON pfi.brand_uuid    = b.uuid
		INNER JOIN areas        ON pf.area_uuid      = areas.uuid
		LEFT  JOIN vc           ON vc.area_uuid      = areas.uuid
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid = ?)
		AND (? = '' OR pf.area_uuid = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL
		GROUP BY areas.name, areas.uuid, b.name, b.uuid, vc.total_posforms
		ORDER BY areas.name, nd_percent DESC`,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid, start_date, end_date,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid, start_date, end_date,
	).Scan(&rows).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "error": err.Error()})
	}

	groupMap := make(map[string]*BarGroup)
	order := []string{}
	for _, r := range rows {
		if _, ok := groupMap[r.TerritoryUUID]; !ok {
			groupMap[r.TerritoryUUID] = &BarGroup{TerritoryName: r.TerritoryName, TerritoryUUID: r.TerritoryUUID, TotalPos: r.TotalPos, Brands: []BrandItem{}}
			order = append(order, r.TerritoryUUID)
		}
		groupMap[r.TerritoryUUID].Brands = append(groupMap[r.TerritoryUUID].Brands, BrandItem{BrandName: r.BrandName, BrandUUID: r.BrandUUID, NdPos: r.NdPos, TotalPos: r.TotalPos, NdPercent: r.NdPercent})
	}
	results := make([]BarGroup, 0, len(order))
	for _, uuid := range order {
		results = append(results, *groupMap[uuid])
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Bar chart data for ND by Area", "data": results})
}

// Bar chart for ND by SubArea with aggregated data - shows ALL sub areas within an area
func NdBarChartSubArea(c *fiber.Ctx) error {
	db := database.DB

	country_uuid  := c.Query("country_uuid")
	province_uuid := c.Query("province_uuid")
	area_uuid     := c.Query("area_uuid")
	sub_area_uuid := c.Query("sub_area_uuid")
	start_date    := c.Query("start_date")
	end_date      := c.Query("end_date")

	type BrandItem struct {
		BrandName string  `json:"brand_name"`
		BrandUUID string  `json:"brand_uuid"`
		NdPos     int64   `json:"nd_pos"`
		TotalPos  int64   `json:"total_pos"`
		NdPercent float64 `json:"nd_percent"`
	}
	type BarGroup struct {
		TerritoryName string      `json:"territory_name"`
		TerritoryUUID string      `json:"territory_uuid"`
		TotalPos      int64       `json:"total_pos"`
		Brands        []BrandItem `json:"brands"`
	}
	type flatRow struct {
		TerritoryName string  `json:"territory_name"`
		TerritoryUUID string  `json:"territory_uuid"`
		BrandName     string  `json:"brand_name"`
		BrandUUID     string  `json:"brand_uuid"`
		NdPos         int64   `json:"nd_pos"`
		TotalPos      int64   `json:"total_pos"`
		NdPercent     float64 `json:"nd_percent"`
	}
	var rows []flatRow

	err := db.Raw(`
		WITH vc AS (
			SELECT pf.sub_area_uuid,
				COUNT(DISTINCT pf.uuid) AS total_posforms
			FROM pos_forms pf
			WHERE pf.country_uuid = ?
			AND (? = '' OR pf.province_uuid = ?)
			AND (? = '' OR pf.area_uuid = ?)
			AND (? = '' OR pf.sub_area_uuid = ?)
			AND pf.created_at BETWEEN ? AND ?
			AND pf.deleted_at IS NULL
			GROUP BY pf.sub_area_uuid
		)
		SELECT
			sa.name                                       AS territory_name,
			sa.uuid                                       AS territory_uuid,
			b.name                                        AS brand_name,
			b.uuid                                        AS brand_uuid,
			COUNT(DISTINCT pfi.pos_form_uuid)             AS nd_pos,
			COALESCE(vc.total_posforms, 0)                AS total_pos,
			COALESCE(ROUND(COUNT(DISTINCT pfi.pos_form_uuid)::numeric * 100.0
				/ NULLIF(vc.total_posforms, 0), 2), 0)    AS nd_percent
		FROM pos_form_items pfi
		INNER JOIN pos_forms pf ON pfi.pos_form_uuid = pf.uuid
		INNER JOIN brands    b  ON pfi.brand_uuid    = b.uuid
		INNER JOIN sub_areas sa ON pf.sub_area_uuid  = sa.uuid
		LEFT  JOIN vc           ON vc.sub_area_uuid  = sa.uuid
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid = ?)
		AND (? = '' OR pf.area_uuid = ?)
		AND (? = '' OR pf.sub_area_uuid = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL
		GROUP BY sa.name, sa.uuid, b.name, b.uuid, vc.total_posforms
		ORDER BY sa.name, nd_percent DESC`,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid, sub_area_uuid, sub_area_uuid, start_date, end_date,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid, sub_area_uuid, sub_area_uuid, start_date, end_date,
	).Scan(&rows).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "error": err.Error()})
	}

	groupMap := make(map[string]*BarGroup)
	order := []string{}
	for _, r := range rows {
		if _, ok := groupMap[r.TerritoryUUID]; !ok {
			groupMap[r.TerritoryUUID] = &BarGroup{TerritoryName: r.TerritoryName, TerritoryUUID: r.TerritoryUUID, TotalPos: r.TotalPos, Brands: []BrandItem{}}
			order = append(order, r.TerritoryUUID)
		}
		groupMap[r.TerritoryUUID].Brands = append(groupMap[r.TerritoryUUID].Brands, BrandItem{BrandName: r.BrandName, BrandUUID: r.BrandUUID, NdPos: r.NdPos, TotalPos: r.TotalPos, NdPercent: r.NdPercent})
	}
	results := make([]BarGroup, 0, len(order))
	for _, uuid := range order {
		results = append(results, *groupMap[uuid])
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Bar chart data for ND by SubArea", "data": results})
}

// Bar chart for ND by Commune with aggregated data - shows ALL communes within a sub area
func NdBarChartCommune(c *fiber.Ctx) error {
	db := database.DB

	country_uuid  := c.Query("country_uuid")
	province_uuid := c.Query("province_uuid")
	area_uuid     := c.Query("area_uuid")
	sub_area_uuid := c.Query("sub_area_uuid")
	commune_uuid  := c.Query("commune_uuid")
	start_date    := c.Query("start_date")
	end_date      := c.Query("end_date")

	type BrandItem struct {
		BrandName string  `json:"brand_name"`
		BrandUUID string  `json:"brand_uuid"`
		NdPos     int64   `json:"nd_pos"`
		TotalPos  int64   `json:"total_pos"`
		NdPercent float64 `json:"nd_percent"`
	}
	type BarGroup struct {
		TerritoryName string      `json:"territory_name"`
		TerritoryUUID string      `json:"territory_uuid"`
		TotalPos      int64       `json:"total_pos"`
		Brands        []BrandItem `json:"brands"`
	}
	type flatRow struct {
		TerritoryName string  `json:"territory_name"`
		TerritoryUUID string  `json:"territory_uuid"`
		BrandName     string  `json:"brand_name"`
		BrandUUID     string  `json:"brand_uuid"`
		NdPos         int64   `json:"nd_pos"`
		TotalPos      int64   `json:"total_pos"`
		NdPercent     float64 `json:"nd_percent"`
	}
	var rows []flatRow

	err := db.Raw(`
		WITH vc AS (
			SELECT pf.commune_uuid,
				COUNT(DISTINCT pf.uuid) AS total_posforms
			FROM pos_forms pf
			WHERE pf.country_uuid = ?
			AND (? = '' OR pf.province_uuid = ?)
			AND (? = '' OR pf.area_uuid = ?)
			AND (? = '' OR pf.sub_area_uuid = ?)
			AND (? = '' OR pf.commune_uuid = ?)
			AND pf.created_at BETWEEN ? AND ?
			AND pf.deleted_at IS NULL
			GROUP BY pf.commune_uuid
		)
		SELECT
			cm.name                                       AS territory_name,
			cm.uuid                                       AS territory_uuid,
			b.name                                        AS brand_name,
			b.uuid                                        AS brand_uuid,
			COUNT(DISTINCT pfi.pos_form_uuid)             AS nd_pos,
			COALESCE(vc.total_posforms, 0)                AS total_pos,
			COALESCE(ROUND(COUNT(DISTINCT pfi.pos_form_uuid)::numeric * 100.0
				/ NULLIF(vc.total_posforms, 0), 2), 0)    AS nd_percent
		FROM pos_form_items pfi
		INNER JOIN pos_forms pf ON pfi.pos_form_uuid = pf.uuid
		INNER JOIN brands    b  ON pfi.brand_uuid    = b.uuid
		INNER JOIN communes  cm ON pf.commune_uuid   = cm.uuid
		LEFT  JOIN vc           ON vc.commune_uuid   = cm.uuid
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid = ?)
		AND (? = '' OR pf.area_uuid = ?)
		AND (? = '' OR pf.sub_area_uuid = ?)
		AND (? = '' OR pf.commune_uuid = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL
		GROUP BY cm.name, cm.uuid, b.name, b.uuid, vc.total_posforms
		ORDER BY cm.name, nd_percent DESC`,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid, sub_area_uuid, sub_area_uuid, commune_uuid, commune_uuid, start_date, end_date,
		country_uuid, province_uuid, province_uuid, area_uuid, area_uuid, sub_area_uuid, sub_area_uuid, commune_uuid, commune_uuid, start_date, end_date,
	).Scan(&rows).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "error": err.Error()})
	}

	groupMap := make(map[string]*BarGroup)
	order := []string{}
	for _, r := range rows {
		if _, ok := groupMap[r.TerritoryUUID]; !ok {
			groupMap[r.TerritoryUUID] = &BarGroup{TerritoryName: r.TerritoryName, TerritoryUUID: r.TerritoryUUID, TotalPos: r.TotalPos, Brands: []BrandItem{}}
			order = append(order, r.TerritoryUUID)
		}
		groupMap[r.TerritoryUUID].Brands = append(groupMap[r.TerritoryUUID].Brands, BrandItem{BrandName: r.BrandName, BrandUUID: r.BrandUUID, NdPos: r.NdPos, TotalPos: r.TotalPos, NdPercent: r.NdPercent})
	}
	results := make([]BarGroup, 0, len(order))
	for _, uuid := range order {
		results = append(results, *groupMap[uuid])
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Bar chart data for ND by Commune", "data": results})
}

// ── NdLineChartByMonth ────────────────────────────────────────────────────────
// Returns monthly ND% trend series per brand for a given date range.
// Response shape: { data: NDBrandSeriesModel[] }
//   NDBrandSeriesModel = { brand_name, brand_uuid, points: NDMonthPointModel[] }
//   NDMonthPointModel  = { brand_name, brand_uuid, month, nd_pos, total_pos, nd_percent }
func NdLineChartByMonth(c *fiber.Ctx) error {
	db := database.DB

	countryUUID  := c.Query("country_uuid")
	provinceUUID := c.Query("province_uuid")
	areaUUID     := c.Query("area_uuid")
	subAreaUUID  := c.Query("sub_area_uuid")
	communeUUID  := c.Query("commune_uuid")
	startDate    := c.Query("start_date")
	endDate      := c.Query("end_date")

	// ── Step 1: total POS-form visits per calendar month ─────────────────────
	type monthTotal struct {
		Month string
		Total int
	}
	var monthTotals []monthTotal
	totalQuery := `
		SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(uuid) AS total
		FROM pos_forms
		WHERE country_uuid = ?
		AND (? = '' OR province_uuid  = ?)
		AND (? = '' OR area_uuid      = ?)
		AND (? = '' OR sub_area_uuid  = ?)
		AND (? = '' OR commune_uuid   = ?)
		AND created_at BETWEEN ? AND ?
		AND deleted_at IS NULL
		GROUP BY month
		ORDER BY month`

	if err := db.Raw(totalQuery,
		countryUUID,
		provinceUUID, provinceUUID,
		areaUUID, areaUUID,
		subAreaUUID, subAreaUUID,
		communeUUID, communeUUID,
		startDate, endDate,
	).Scan(&monthTotals).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to query monthly totals",
			"error":   err.Error(),
		})
	}

	monthMap := make(map[string]int, len(monthTotals))
	for _, mt := range monthTotals {
		monthMap[mt.Month] = mt.Total
	}

	// ── Step 2: ND presence per brand per month ───────────────────────────────
	type brandMonthRow struct {
		BrandName string
		BrandUUID string
		Month     string
		NdPos     int
	}
	var ndRows []brandMonthRow
	ndQuery := `
		SELECT
			b.name                                     AS brand_name,
			b.uuid                                     AS brand_uuid,
			TO_CHAR(pf.created_at, 'YYYY-MM')          AS month,
			COUNT(DISTINCT pfi.pos_form_uuid)           AS nd_pos
		FROM pos_form_items pfi
		INNER JOIN pos_forms pf ON pfi.pos_form_uuid = pf.uuid
		INNER JOIN brands    b  ON pfi.brand_uuid     = b.uuid
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid  = ?)
		AND (? = '' OR pf.area_uuid      = ?)
		AND (? = '' OR pf.sub_area_uuid  = ?)
		AND (? = '' OR pf.commune_uuid   = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL
		GROUP BY b.name, b.uuid, TO_CHAR(pf.created_at, 'YYYY-MM')
		ORDER BY b.name, month ASC`

	if err := db.Raw(ndQuery,
		countryUUID,
		provinceUUID, provinceUUID,
		areaUUID, areaUUID,
		subAreaUUID, subAreaUUID,
		communeUUID, communeUUID,
		startDate, endDate,
	).Scan(&ndRows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to query ND by brand by month",
			"error":   err.Error(),
		})
	}

	// ── Step 3: group into NDBrandSeriesModel[] ───────────────────────────────
	type pointModel struct {
		BrandName string  `json:"brand_name"`
		BrandUUID string  `json:"brand_uuid"`
		Month     string  `json:"month"`
		NdPos     int     `json:"nd_pos"`
		TotalPos  int     `json:"total_pos"`
		NdPercent float64 `json:"nd_percent"`
	}
	type seriesModel struct {
		BrandName string       `json:"brand_name"`
		BrandUUID string       `json:"brand_uuid"`
		Points    []pointModel `json:"points"`
	}

	seriesMap   := make(map[string]*seriesModel)
	brandOrder  := []string{}

	for _, r := range ndRows {
		if _, ok := seriesMap[r.BrandUUID]; !ok {
			seriesMap[r.BrandUUID] = &seriesModel{
				BrandName: r.BrandName,
				BrandUUID: r.BrandUUID,
				Points:    []pointModel{},
			}
			brandOrder = append(brandOrder, r.BrandUUID)
		}
		total := monthMap[r.Month]
		ndPct := 0.0
		if total > 0 {
			ndPct = float64(r.NdPos) * 100.0 / float64(total)
		}
		seriesMap[r.BrandUUID].Points = append(seriesMap[r.BrandUUID].Points, pointModel{
			BrandName: r.BrandName,
			BrandUUID: r.BrandUUID,
			Month:     r.Month,
			NdPos:     r.NdPos,
			TotalPos:  total,
			NdPercent: ndPct,
		})
	}

	result := make([]seriesModel, 0, len(brandOrder))
	for _, uuid := range brandOrder {
		result = append(result, *seriesMap[uuid])
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Monthly ND% trend by brand",
		"data":    result,
	})
}

// ── NdHeatmap ─────────────────────────────────────────────────────────────────
// Returns territory × brand ND% matrix.
// Query param: level = province|area|subarea|commune
// Response shape: { data: NDHeatmapModel }
//   NDHeatmapModel = { brands: [{uuid,name}], territories: [{uuid,name}], matrix: number[][] }
func NdHeatmap(c *fiber.Ctx) error {
	db    := database.DB
	level := c.Query("level", "province")

	countryUUID  := c.Query("country_uuid")
	provinceUUID := c.Query("province_uuid")
	areaUUID     := c.Query("area_uuid")
	subAreaUUID  := c.Query("sub_area_uuid")
	communeUUID  := c.Query("commune_uuid")
	startDate    := c.Query("start_date")
	endDate      := c.Query("end_date")

	// ── Resolve territory columns from level param ────────────────────────────
	var terrTable, terrUUIDCol, terrNameCol, pfTerrCol string
	switch level {
	case "area":
		terrTable   = "areas"
		terrUUIDCol = "areas.uuid"
		terrNameCol = "areas.name"
		pfTerrCol   = "pf.area_uuid"
	case "subarea":
		terrTable   = "sub_areas"
		terrUUIDCol = "sub_areas.uuid"
		terrNameCol = "sub_areas.name"
		pfTerrCol   = "pf.sub_area_uuid"
	case "commune":
		terrTable   = "communes"
		terrUUIDCol = "communes.uuid"
		terrNameCol = "communes.name"
		pfTerrCol   = "pf.commune_uuid"
	default: // province
		level       = "province"
		terrTable   = "provinces"
		terrUUIDCol = "provinces.uuid"
		terrNameCol = "provinces.name"
		pfTerrCol   = "pf.province_uuid"
	}

	// ── Step 1: total visits per territory ────────────────────────────────────
	type terrTotal struct {
		UUID  string
		Total int
	}
	totalSQL := fmt.Sprintf(`
		SELECT %s AS uuid, COUNT(DISTINCT pf.uuid) AS total
		FROM pos_forms pf
		INNER JOIN %s ON %s = %s
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid  = ?)
		AND (? = '' OR pf.area_uuid      = ?)
		AND (? = '' OR pf.sub_area_uuid  = ?)
		AND (? = '' OR pf.commune_uuid   = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL
		GROUP BY %s`,
		terrUUIDCol,
		terrTable, pfTerrCol, terrUUIDCol,
		terrUUIDCol,
	)
	var terrTotals []terrTotal
	if err := db.Raw(totalSQL,
		countryUUID,
		provinceUUID, provinceUUID,
		areaUUID, areaUUID,
		subAreaUUID, subAreaUUID,
		communeUUID, communeUUID,
		startDate, endDate,
	).Scan(&terrTotals).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to query territory totals",
			"error":   err.Error(),
		})
	}
	terrTotalMap := make(map[string]int, len(terrTotals))
	for _, t := range terrTotals {
		terrTotalMap[t.UUID] = t.Total
	}

	// ── Step 2: ND presence per territory × brand ─────────────────────────────
	type heatRow struct {
		TerritoryUUID string
		TerritoryName string
		BrandUUID     string
		BrandName     string
		NdPos         int
	}
	ndSQL := fmt.Sprintf(`
		SELECT
			%s AS territory_uuid,
			%s AS territory_name,
			b.uuid AS brand_uuid,
			b.name AS brand_name,
			COUNT(DISTINCT pfi.pos_form_uuid) AS nd_pos
		FROM pos_form_items pfi
		INNER JOIN pos_forms pf ON pfi.pos_form_uuid = pf.uuid
		INNER JOIN brands    b  ON pfi.brand_uuid    = b.uuid
		INNER JOIN %s        ON %s = %s
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid  = ?)
		AND (? = '' OR pf.area_uuid      = ?)
		AND (? = '' OR pf.sub_area_uuid  = ?)
		AND (? = '' OR pf.commune_uuid   = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL
		GROUP BY territory_uuid, territory_name, b.uuid, b.name
		ORDER BY territory_name, b.name`,
		terrUUIDCol, terrNameCol,
		terrTable, pfTerrCol, terrUUIDCol,
	)
	var heatRows []heatRow
	if err := db.Raw(ndSQL,
		countryUUID,
		provinceUUID, provinceUUID,
		areaUUID, areaUUID,
		subAreaUUID, subAreaUUID,
		communeUUID, communeUUID,
		startDate, endDate,
	).Scan(&heatRows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to query ND heatmap data",
			"error":   err.Error(),
		})
	}

	// ── Step 3: Build NDHeatmapModel ─────────────────────────────────────────
	type nameUUID struct {
		UUID string `json:"uuid"`
		Name string `json:"name"`
	}

	brandOrder := []string{}
	brandSeen  := make(map[string]string) // uuid → name
	terrOrder  := []string{}
	terrSeen   := make(map[string]string) // uuid → name
	cellMap    := make(map[string]map[string]float64) // terrUUID → brandUUID → ndPct

	for _, r := range heatRows {
		if _, ok := brandSeen[r.BrandUUID]; !ok {
			brandSeen[r.BrandUUID] = r.BrandName
			brandOrder = append(brandOrder, r.BrandUUID)
		}
		if _, ok := terrSeen[r.TerritoryUUID]; !ok {
			terrSeen[r.TerritoryUUID] = r.TerritoryName
			terrOrder = append(terrOrder, r.TerritoryUUID)
			cellMap[r.TerritoryUUID] = make(map[string]float64)
		}
		total := terrTotalMap[r.TerritoryUUID]
		ndPct := 0.0
		if total > 0 {
			ndPct = float64(r.NdPos) * 100.0 / float64(total)
		}
		cellMap[r.TerritoryUUID][r.BrandUUID] = ndPct
	}

	brands := make([]nameUUID, 0, len(brandOrder))
	for _, u := range brandOrder {
		brands = append(brands, nameUUID{UUID: u, Name: brandSeen[u]})
	}
	territories := make([]nameUUID, 0, len(terrOrder))
	for _, u := range terrOrder {
		territories = append(territories, nameUUID{UUID: u, Name: terrSeen[u]})
	}
	// matrix[brand_index][territory_index] — as expected by Angular buildHeatmapChart
	matrix := make([][]float64, 0, len(brandOrder))
	for _, bu := range brandOrder {
		row := make([]float64, len(terrOrder))
		for j, tu := range terrOrder {
			if v, ok := cellMap[tu][bu]; ok {
				row[j] = math.Round(v*100) / 100
			}
		}
		matrix = append(matrix, row)
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "ND heatmap data",
		"data": fiber.Map{
			"brands":      brands,
			"territories": territories,
			"matrix":      matrix,
		},
	})
}

// ── NdSummaryKPI ──────────────────────────────────────────────────────────────
// Returns executive KPI card for Numeric Distribution.
// Response: NDSummaryKPIModel
func NdSummaryKPI(c *fiber.Ctx) error {
	db := database.DB

	countryUUID  := c.Query("country_uuid")
	provinceUUID := c.Query("province_uuid")
	areaUUID     := c.Query("area_uuid")
	subAreaUUID  := c.Query("sub_area_uuid")
	communeUUID  := c.Query("commune_uuid")
	startDate    := c.Query("start_date")
	endDate      := c.Query("end_date")

	type kpiRow struct {
		TotalVisitedPos int     `json:"total_visited_pos"`
		TotalNdPos      int     `json:"total_nd_pos"`
		TotalBrands     int     `json:"total_brands"`
		AvgNdPercent    float64 `json:"avg_nd_percent"`
	}

	var kpi kpiRow
	err := db.Raw(`
		SELECT
			COUNT(DISTINCT pf.uuid)           AS total_visited_pos,
			COUNT(DISTINCT pfi.pos_form_uuid) AS total_nd_pos,
			COUNT(DISTINCT pfi.brand_uuid)    AS total_brands,
			COALESCE(
				ROUND(
					COUNT(DISTINCT pfi.pos_form_uuid)::numeric * 100.0 /
					NULLIF(COUNT(DISTINCT pf.uuid), 0),
				2), 0
			)                                 AS avg_nd_percent
		FROM pos_forms pf
		LEFT JOIN pos_form_items pfi ON pfi.pos_form_uuid = pf.uuid
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid = ?)
		AND (? = '' OR pf.area_uuid     = ?)
		AND (? = '' OR pf.sub_area_uuid = ?)
		AND (? = '' OR pf.commune_uuid  = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL`,
		countryUUID,
		provinceUUID, provinceUUID,
		areaUUID, areaUUID,
		subAreaUUID, subAreaUUID,
		communeUUID, communeUUID,
		startDate, endDate,
	).Scan(&kpi).Error

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to query ND summary KPI",
			"error":   err.Error(),
		})
	}

	reachRate := 0.0
	if kpi.TotalVisitedPos > 0 {
		reachRate = float64(kpi.TotalNdPos) * 100.0 / float64(kpi.TotalVisitedPos)
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "ND summary KPI",
		"data": fiber.Map{
			"total_universe_pos": kpi.TotalVisitedPos,
			"total_visited_pos":  kpi.TotalVisitedPos,
			"total_nd_pos":       kpi.TotalNdPos,
			"avg_nd_percent":     kpi.AvgNdPercent,
			"total_brands":       kpi.TotalBrands,
			"reach_rate":         reachRate,
			"coverage_index":     kpi.AvgNdPercent,
		},
	})
}

// ── NdBrandRanking ────────────────────────────────────────────────────────────
// Returns brands ranked by ND% descending.
// Response: NDBrandRankModel[]
func NdBrandRanking(c *fiber.Ctx) error {
	db := database.DB

	countryUUID  := c.Query("country_uuid")
	provinceUUID := c.Query("province_uuid")
	areaUUID     := c.Query("area_uuid")
	subAreaUUID  := c.Query("sub_area_uuid")
	communeUUID  := c.Query("commune_uuid")
	startDate    := c.Query("start_date")
	endDate      := c.Query("end_date")

	type rankRow struct {
		BrandName   string  `json:"brand_name"`
		BrandUUID   string  `json:"brand_uuid"`
		NdPos       int     `json:"nd_pos"`
		TotalPos    int     `json:"total_pos"`
		NdPercent   float64 `json:"nd_percent"`
		TotalFarde  int     `json:"total_farde"`
		AvgFarde    float64 `json:"avg_farde"`
	}

	var rows []rankRow
	err := db.Raw(`
		SELECT
			b.name                              AS brand_name,
			b.uuid                              AS brand_uuid,
			COUNT(DISTINCT pfi.pos_form_uuid)   AS nd_pos,
			(SELECT COUNT(DISTINCT pf2.uuid)
				FROM pos_forms pf2
				WHERE pf2.country_uuid = ?
				AND (? = '' OR pf2.province_uuid = ?)
				AND (? = '' OR pf2.area_uuid     = ?)
				AND (? = '' OR pf2.sub_area_uuid = ?)
				AND (? = '' OR pf2.commune_uuid  = ?)
				AND pf2.created_at BETWEEN ? AND ?
				AND pf2.deleted_at IS NULL
			)                                   AS total_pos,
			COALESCE(ROUND(
				COUNT(DISTINCT pfi.pos_form_uuid)::numeric * 100.0 /
				NULLIF((SELECT COUNT(DISTINCT pf2.uuid)
					FROM pos_forms pf2
					WHERE pf2.country_uuid = ?
					AND (? = '' OR pf2.province_uuid = ?)
					AND (? = '' OR pf2.area_uuid     = ?)
					AND (? = '' OR pf2.sub_area_uuid = ?)
					AND (? = '' OR pf2.commune_uuid  = ?)
					AND pf2.created_at BETWEEN ? AND ?
					AND pf2.deleted_at IS NULL
				), 0), 2
			), 0)                               AS nd_percent,
			0                                   AS total_farde,
			0                                   AS avg_farde
		FROM pos_form_items pfi
		INNER JOIN pos_forms pf ON pfi.pos_form_uuid = pf.uuid
		INNER JOIN brands    b  ON pfi.brand_uuid    = b.uuid
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid = ?)
		AND (? = '' OR pf.area_uuid     = ?)
		AND (? = '' OR pf.sub_area_uuid = ?)
		AND (? = '' OR pf.commune_uuid  = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL
		GROUP BY b.name, b.uuid
		ORDER BY nd_percent DESC`,
		// total_pos subquery args (first)
		countryUUID,
		provinceUUID, provinceUUID,
		areaUUID, areaUUID,
		subAreaUUID, subAreaUUID,
		communeUUID, communeUUID,
		startDate, endDate,
		// nd_percent subquery args
		countryUUID,
		provinceUUID, provinceUUID,
		areaUUID, areaUUID,
		subAreaUUID, subAreaUUID,
		communeUUID, communeUUID,
		startDate, endDate,
		// outer WHERE args
		countryUUID,
		provinceUUID, provinceUUID,
		areaUUID, areaUUID,
		subAreaUUID, subAreaUUID,
		communeUUID, communeUUID,
		startDate, endDate,
	).Scan(&rows).Error

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to query ND brand ranking",
			"error":   err.Error(),
		})
	}

	type rankResult struct {
		Rank        int     `json:"rank"`
		BrandName   string  `json:"brand_name"`
		BrandUUID   string  `json:"brand_uuid"`
		NdPos       int     `json:"nd_pos"`
		TotalPos    int     `json:"total_pos"`
		NdPercent   float64 `json:"nd_percent"`
		TotalFarde  int     `json:"total_farde"`
		AvgFarde    float64 `json:"avg_farde"`
	}
	result := make([]rankResult, len(rows))
	for i, r := range rows {
		result[i] = rankResult{
			Rank:       i + 1,
			BrandName:  r.BrandName,
			BrandUUID:  r.BrandUUID,
			NdPos:      r.NdPos,
			TotalPos:   r.TotalPos,
			NdPercent:  r.NdPercent,
			TotalFarde: r.TotalFarde,
			AvgFarde:   r.AvgFarde,
		}
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "ND brand ranking",
		"data":    result,
	})
}

// ── NdGapAnalysis ─────────────────────────────────────────────────────────────
// 3-zone opportunity funnel per brand:
//   Zone A = POS where brand was present (ND)
//   Zone B = POS visited but brand absent
//   Zone C = POS in universe not yet visited
// Response: NDGapRowModel[]
func NdGapAnalysis(c *fiber.Ctx) error {
	db := database.DB

	countryUUID  := c.Query("country_uuid")
	provinceUUID := c.Query("province_uuid")
	areaUUID     := c.Query("area_uuid")
	subAreaUUID  := c.Query("sub_area_uuid")
	communeUUID  := c.Query("commune_uuid")
	startDate    := c.Query("start_date")
	endDate      := c.Query("end_date")

	// total visited POS in scope
	var totalVisited int
	db.Raw(`
		SELECT COUNT(DISTINCT uuid) FROM pos_forms
		WHERE country_uuid = ?
		AND (? = '' OR province_uuid = ?)
		AND (? = '' OR area_uuid     = ?)
		AND (? = '' OR sub_area_uuid = ?)
		AND (? = '' OR commune_uuid  = ?)
		AND created_at BETWEEN ? AND ?
		AND deleted_at IS NULL`,
		countryUUID,
		provinceUUID, provinceUUID,
		areaUUID, areaUUID,
		subAreaUUID, subAreaUUID,
		communeUUID, communeUUID,
		startDate, endDate,
	).Scan(&totalVisited)

	type gapRow struct {
		BrandName string  `json:"brand_name"`
		BrandUUID string  `json:"brand_uuid"`
		NdPos     int     `json:"nd_pos"`
	}
	var rows []gapRow
	err := db.Raw(`
		SELECT
			b.name                            AS brand_name,
			b.uuid                            AS brand_uuid,
			COUNT(DISTINCT pfi.pos_form_uuid) AS nd_pos
		FROM pos_form_items pfi
		INNER JOIN pos_forms pf ON pfi.pos_form_uuid = pf.uuid
		INNER JOIN brands    b  ON pfi.brand_uuid    = b.uuid
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid = ?)
		AND (? = '' OR pf.area_uuid     = ?)
		AND (? = '' OR pf.sub_area_uuid = ?)
		AND (? = '' OR pf.commune_uuid  = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL
		GROUP BY b.name, b.uuid
		ORDER BY nd_pos DESC`,
		countryUUID,
		provinceUUID, provinceUUID,
		areaUUID, areaUUID,
		subAreaUUID, subAreaUUID,
		communeUUID, communeUUID,
		startDate, endDate,
	).Scan(&rows).Error

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to query ND gap analysis",
			"error":   err.Error(),
		})
	}

	type gapResult struct {
		BrandName       string  `json:"brand_name"`
		BrandUUID       string  `json:"brand_uuid"`
		NdPos           int     `json:"nd_pos"`
		VisitedGapPos   int     `json:"visited_gap_pos"`
		UniverseGapPos  int     `json:"universe_gap_pos"`
		TotalVisited    int     `json:"total_visited"`
		TotalUniverse   int     `json:"total_universe"`
		NdPercent       float64 `json:"nd_percent"`
		ReachRate       float64 `json:"reach_rate"`
		OpportunityPct  float64 `json:"opportunity_pct"`
	}

	result := make([]gapResult, len(rows))
	for i, r := range rows {
		visitedGap  := totalVisited - r.NdPos
		if visitedGap < 0 { visitedGap = 0 }
		ndPct := 0.0
		if totalVisited > 0 {
			ndPct = float64(r.NdPos) * 100.0 / float64(totalVisited)
		}
		oppPct := 0.0
		if totalVisited > 0 {
			oppPct = float64(visitedGap) * 100.0 / float64(totalVisited)
		}
		result[i] = gapResult{
			BrandName:      r.BrandName,
			BrandUUID:      r.BrandUUID,
			NdPos:          r.NdPos,
			VisitedGapPos:  visitedGap,
			UniverseGapPos: 0, // no universe POS table available
			TotalVisited:   totalVisited,
			TotalUniverse:  totalVisited,
			NdPercent:      ndPct,
			ReachRate:      ndPct,
			OpportunityPct: oppPct,
		}
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "ND gap analysis",
		"data":    result,
	})
}

// ── NdEvolution ───────────────────────────────────────────────────────────────
// Period-over-period ND% comparison (current window vs equal-length prior window).
// Response: NDEvolutionRowModel[]
func NdEvolution(c *fiber.Ctx) error {
	db := database.DB

	countryUUID  := c.Query("country_uuid")
	provinceUUID := c.Query("province_uuid")
	areaUUID     := c.Query("area_uuid")
	subAreaUUID  := c.Query("sub_area_uuid")
	communeUUID  := c.Query("commune_uuid")
	startDate    := c.Query("start_date")
	endDate      := c.Query("end_date")

	// Derive previous period of same length
	prevQuery := `
		SELECT
			?::date - (?::date - ?::date) AS prev_start,
			?::date - INTERVAL '1 day'    AS prev_end`
	type prevDates struct {
		PrevStart string
		PrevEnd   string
	}
	var prev prevDates
	db.Raw(prevQuery, startDate, endDate, startDate, startDate).Scan(&prev)
	prevStart := prev.PrevStart
	prevEnd   := prev.PrevEnd

	geoArgs := []interface{}{
		provinceUUID, provinceUUID,
		areaUUID, areaUUID,
		subAreaUUID, subAreaUUID,
		communeUUID, communeUUID,
	}

	// current period totals and ND per brand
	type periodRow struct {
		BrandName string  `json:"brand_name"`
		BrandUUID string  `json:"brand_uuid"`
		NdPos     int     `json:"nd_pos"`
		TotalPos  int     `json:"total_pos"`
		NdPct     float64 `json:"nd_pct"`
	}

	ndSQL := `
		SELECT
			b.name                            AS brand_name,
			b.uuid                            AS brand_uuid,
			COUNT(DISTINCT pfi.pos_form_uuid) AS nd_pos,
			(SELECT COUNT(DISTINCT pf2.uuid) FROM pos_forms pf2
				WHERE pf2.country_uuid = ?
				AND (? = '' OR pf2.province_uuid = ?)
				AND (? = '' OR pf2.area_uuid     = ?)
				AND (? = '' OR pf2.sub_area_uuid = ?)
				AND (? = '' OR pf2.commune_uuid  = ?)
				AND pf2.created_at BETWEEN ? AND ?
				AND pf2.deleted_at IS NULL
			)                                 AS total_pos,
			COALESCE(ROUND(
				COUNT(DISTINCT pfi.pos_form_uuid)::numeric * 100.0 /
				NULLIF((SELECT COUNT(DISTINCT pf2.uuid) FROM pos_forms pf2
					WHERE pf2.country_uuid = ?
					AND (? = '' OR pf2.province_uuid = ?)
					AND (? = '' OR pf2.area_uuid     = ?)
					AND (? = '' OR pf2.sub_area_uuid = ?)
					AND (? = '' OR pf2.commune_uuid  = ?)
					AND pf2.created_at BETWEEN ? AND ?
					AND pf2.deleted_at IS NULL
				), 0), 2
			), 0)                             AS nd_pct
		FROM pos_form_items pfi
		INNER JOIN pos_forms pf ON pfi.pos_form_uuid = pf.uuid
		INNER JOIN brands    b  ON pfi.brand_uuid    = b.uuid
		WHERE pf.country_uuid = ?
		AND (? = '' OR pf.province_uuid = ?)
		AND (? = '' OR pf.area_uuid     = ?)
		AND (? = '' OR pf.sub_area_uuid = ?)
		AND (? = '' OR pf.commune_uuid  = ?)
		AND pf.created_at BETWEEN ? AND ?
		AND pf.deleted_at IS NULL
		GROUP BY b.name, b.uuid
		ORDER BY nd_pct DESC`

	// args: subquery1 + subquery2 + outer WHERE, each needs countryUUID + geoArgs + dateRange
	buildArgs := func(sd, ed string) []interface{} {
		return append(append(append(append(append(
			[]interface{}{countryUUID},
			geoArgs...),
			sd, ed,
			countryUUID),
			geoArgs...),
			sd, ed,
			countryUUID),
			append(geoArgs, sd, ed)...,
		)
	}

	var currRows []periodRow
	if err := db.Raw(ndSQL, buildArgs(startDate, endDate)...).Scan(&currRows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to query current period ND",
			"error":   err.Error(),
		})
	}

	var prevRows []periodRow
	if err := db.Raw(ndSQL, buildArgs(prevStart, prevEnd)...).Scan(&prevRows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to query previous period ND",
			"error":   err.Error(),
		})
	}

	// Index previous by brand UUID
	prevMap := make(map[string]periodRow, len(prevRows))
	for _, r := range prevRows {
		prevMap[r.BrandUUID] = r
	}

	type evolResult struct {
		BrandName          string  `json:"brand_name"`
		BrandUUID          string  `json:"brand_uuid"`
		CurrentNdPos       int     `json:"current_nd_pos"`
		PreviousNdPos      int     `json:"previous_nd_pos"`
		CurrentTotalPos    int     `json:"current_total_pos"`
		PreviousTotalPos   int     `json:"previous_total_pos"`
		CurrentNdPercent   float64 `json:"current_nd_percent"`
		PreviousNdPercent  float64 `json:"previous_nd_percent"`
		Delta              float64 `json:"delta"`
		Trend              string  `json:"trend"`
	}

	result := make([]evolResult, 0, len(currRows))
	for _, c := range currRows {
		p := prevMap[c.BrandUUID]
		delta := c.NdPct - p.NdPct
		trend := "stable"
		if delta > 0.5 {
			trend = "up"
		} else if delta < -0.5 {
			trend = "down"
		}
		result = append(result, evolResult{
			BrandName:         c.BrandName,
			BrandUUID:         c.BrandUUID,
			CurrentNdPos:      c.NdPos,
			PreviousNdPos:     p.NdPos,
			CurrentTotalPos:   c.TotalPos,
			PreviousTotalPos:  p.TotalPos,
			CurrentNdPercent:  c.NdPct,
			PreviousNdPercent: p.NdPct,
			Delta:             delta,
			Trend:             trend,
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "ND evolution (period-over-period)",
		"data":    result,
	})
}
